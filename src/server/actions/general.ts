'use server';

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireGeneralUser } from '@/server/auth';
import {
  MAX_MP3_BYTES,
  MAX_MP3_PER_USER,
  MP3_DIR,
  mp3PathFor,
  mp3RelativePath,
} from '@/lib/uploads';

export interface GeneralSpeakerRow {
  id: string;
  name: string;
  ext: string;
  area: string;
  online: boolean;
}

export interface GeneralHomeData {
  user: { id: string; username: string; name: string };
  project: { id: string; name: string } | null;
  speakers: GeneralSpeakerRow[];
}

export async function getGeneralHomeData(): Promise<GeneralHomeData> {
  const session = await requireGeneralUser();
  const sessionUser = session?.user;
  const username = sessionUser?.username ?? '';

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      project: true,
      assignedSpeakers: {
        include: { speaker: true },
        orderBy: { speaker: { ext: 'asc' } },
      },
    },
  });
  if (!user) {
    return {
      user: { id: '', username, name: sessionUser?.name ?? username },
      project: null,
      speakers: [],
    };
  }

  return {
    user: { id: user.id, username: user.username, name: user.name },
    project: user.project ? { id: user.project.id, name: user.project.name } : null,
    speakers: user.assignedSpeakers.map(a => ({
      id: a.speaker.id,
      name: a.speaker.name,
      ext: a.speaker.ext,
      area: a.speaker.area,
      online: a.speaker.online,
    })),
  };
}

export interface GeneralHistoryRow {
  id: string;
  type: 'emergency' | 'group' | 'single' | 'scheduled' | 'mp3';
  target: string;
  durationSec: number;
  occurredAt: string;
  hasRecording: boolean;
}

const TYPE_FROM_DB = {
  EMERGENCY: 'emergency',
  GROUP: 'group',
  SINGLE: 'single',
  SCHEDULED: 'scheduled',
  MP3: 'mp3',
} as const;

export async function listMyBroadcastHistory(): Promise<GeneralHistoryRow[]> {
  const session = await requireGeneralUser();
  const username = session?.user?.username ?? '';
  if (!username) return [];

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) return [];

  const rows = await prisma.logEntry.findMany({
    where: { userId: user.id },
    orderBy: { occurredAt: 'desc' },
    take: 100,
  });

  return rows.map(r => ({
    id: r.id,
    type: TYPE_FROM_DB[r.type],
    target: r.target,
    durationSec: r.durationSec,
    occurredAt: r.occurredAt.toISOString(),
    hasRecording: r.recordingPath !== null,
  }));
}

export type MarkSpeakerStatusResult =
  | { ok: true }
  | { ok: false; error: 'not_authorized' | 'not_assigned' };

export type ClaimSpeakerResult =
  | { ok: true }
  | { ok: false; error: 'not_authorized' | 'not_assigned' | 'busy' };

async function authorizeMyAssignedSpeaker(
  speakerId: string,
): Promise<{ ok: true } | { ok: false; error: 'not_authorized' | 'not_assigned' }> {
  const session = await requireGeneralUser();
  const username = session?.user?.username ?? '';
  if (!username) return { ok: false, error: 'not_authorized' };

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) return { ok: false, error: 'not_authorized' };

  const assignment = await prisma.speakerAssignment.findFirst({
    where: { userId: user.id, speakerId },
    select: { speakerId: true },
  });
  if (!assignment) return { ok: false, error: 'not_assigned' };

  return { ok: true };
}

// Atomic IDLE→BUSY transition; updateMany with a status guard prevents two callers from both winning the claim.
export async function claimSpeakerForCall(
  speakerId: string,
): Promise<ClaimSpeakerResult> {
  const authz = await authorizeMyAssignedSpeaker(speakerId);
  if (!authz.ok) return authz;

  const result = await prisma.speaker.updateMany({
    where: { id: speakerId, status: 'IDLE' },
    data: { status: 'BUSY' },
  });
  if (result.count === 0) return { ok: false, error: 'busy' };

  revalidatePath('/[locale]/admin/projects/[id]', 'page');
  revalidatePath('/[locale]/admin/status', 'page');
  return { ok: true };
}

export async function markMySpeakerIdle(
  speakerId: string,
): Promise<MarkSpeakerStatusResult> {
  const authz = await authorizeMyAssignedSpeaker(speakerId);
  if (!authz.ok) return authz;

  await prisma.speaker.update({
    where: { id: speakerId },
    data: { status: 'IDLE' },
  });

  revalidatePath('/[locale]/admin/projects/[id]', 'page');
  revalidatePath('/[locale]/admin/status', 'page');
  return { ok: true };
}

// ---------- MP3 library (per-user, private storage) ----------

export interface Mp3LibraryRow {
  id: string;
  name: string;
  sizeBytes: number;
  durationSec: number;
  uploadedAt: string;
}

async function currentUserId(): Promise<string | null> {
  const session = await requireGeneralUser();
  const username = session?.user?.username ?? '';
  if (!username) return null;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function listMyMp3Library(): Promise<Mp3LibraryRow[]> {
  const userId = await currentUserId();
  if (!userId) return [];

  const rows = await prisma.mp3File.findMany({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
  });

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    sizeBytes: Number(r.sizeBytes),
    durationSec: r.durationSec,
    uploadedAt: r.uploadedAt.toISOString(),
  }));
}

export type UploadMyMp3Result =
  | { ok: true; id: string }
  | {
      ok: false;
      error: 'not_authorized' | 'no_file' | 'invalid_type' | 'too_large' | 'quota_full';
    };

export async function uploadMyMp3(formData: FormData): Promise<UploadMyMp3Result> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: 'not_authorized' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'no_file' };
  }

  const looksLikeMp3 =
    file.type === 'audio/mpeg' ||
    file.type === 'audio/mp3' ||
    file.name.toLowerCase().endsWith('.mp3');
  if (!looksLikeMp3) return { ok: false, error: 'invalid_type' };

  if (file.size > MAX_MP3_BYTES) return { ok: false, error: 'too_large' };

  const existingCount = await prisma.mp3File.count({ where: { userId } });
  if (existingCount >= MAX_MP3_PER_USER) {
    return { ok: false, error: 'quota_full' };
  }

  const displayName = (typeof formData.get('name') === 'string' && (formData.get('name') as string).trim())
    ? (formData.get('name') as string).trim()
    : file.name.replace(/\.mp3$/i, '');

  const created = await prisma.mp3File.create({
    data: {
      userId,
      name: displayName.slice(0, 120),
      sizeBytes: BigInt(file.size),
      durationSec: 0,
      storagePath: 'pending',
    },
    select: { id: true },
  });

  try {
    await fs.mkdir(path.join(MP3_DIR, userId), { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(mp3PathFor(userId, created.id), buf);
    await prisma.mp3File.update({
      where: { id: created.id },
      data: { storagePath: mp3RelativePath(userId, created.id) },
    });
  } catch (err) {
    await prisma.mp3File.delete({ where: { id: created.id } }).catch(() => {});
    throw err;
  }

  revalidatePath('/[locale]/general', 'page');
  return { ok: true, id: created.id };
}

export type DeleteMyMp3Result =
  | { ok: true }
  | { ok: false; error: 'not_authorized' | 'not_found' };

export async function deleteMyMp3(id: string): Promise<DeleteMyMp3Result> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: 'not_authorized' };

  const row = await prisma.mp3File.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!row) return { ok: false, error: 'not_found' };

  await prisma.mp3File.delete({ where: { id: row.id } });

  try {
    await fs.unlink(mp3PathFor(userId, row.id));
  } catch {
    /* file may already be gone */
  }

  revalidatePath('/[locale]/general', 'page');
  return { ok: true };
}
