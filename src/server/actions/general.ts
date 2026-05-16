'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireGeneralUser } from '@/server/auth';

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
