'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/server/auth';

export type SpeakerCallStatus = 'idle' | 'busy';

export interface SpeakerRow {
  id: string;
  name: string;
  ext: string;
  area: string;
  online: boolean;
  status: SpeakerCallStatus;
  asteriskId: string;
}

const STATUS_FROM_DB = {
  IDLE: 'idle',
  BUSY: 'busy',
} as const satisfies Record<'IDLE' | 'BUSY', SpeakerCallStatus>;

export async function listProjectSpeakers(projectId: string): Promise<SpeakerRow[]> {
  await requireAdmin();
  const rows = await prisma.speaker.findMany({
    where: { projectId },
    orderBy: { ext: 'asc' },
  });
  return rows.map(s => ({
    id: s.id,
    name: s.name,
    ext: s.ext,
    area: s.area,
    online: s.online,
    status: STATUS_FROM_DB[s.status],
    asteriskId: s.asteriskId,
  }));
}

export type CreateSpeakerResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error: 'required' | 'ext_format' | 'ext_taken' | 'asterisk_missing' | 'project_missing';
    };

export async function createSpeaker(input: {
  projectId: string;
  name: string;
  ext: string;
  area: string;
  asteriskId: string;
  volume?: number;
}): Promise<CreateSpeakerResult> {
  await requireAdmin();
  const name = input.name.trim();
  const ext = input.ext.trim();
  const area = input.area.trim();

  if (!name || !ext || !area || !input.asteriskId || !input.projectId) {
    return { ok: false, error: 'required' };
  }
  if (!/^\d{3,6}$/.test(ext)) return { ok: false, error: 'ext_format' };

  const [project, asterisk, dup] = await Promise.all([
    prisma.project.findUnique({ where: { id: input.projectId }, select: { id: true } }),
    prisma.asterisk.findUnique({ where: { id: input.asteriskId }, select: { id: true } }),
    prisma.speaker.findUnique({
      where: { projectId_ext: { projectId: input.projectId, ext } },
      select: { id: true },
    }),
  ]);
  if (!project) return { ok: false, error: 'project_missing' };
  if (!asterisk) return { ok: false, error: 'asterisk_missing' };
  if (dup) return { ok: false, error: 'ext_taken' };

  const volume = Math.min(100, Math.max(0, input.volume ?? 80));
  const created = await prisma.speaker.create({
    data: {
      projectId: input.projectId,
      asteriskId: input.asteriskId,
      name,
      ext,
      area,
      volume,
    },
  });

  revalidatePath('/[locale]/admin/projects', 'page');
  revalidatePath('/[locale]/admin/projects/[id]', 'page');
  revalidatePath('/[locale]/admin/dashboard', 'page');
  return { ok: true, id: created.id };
}

export type UpdateSpeakerResult =
  | { ok: true }
  | {
      ok: false;
      error: 'required' | 'ext_format' | 'ext_taken' | 'asterisk_missing' | 'not_found';
    };

export async function updateSpeaker(input: {
  id: string;
  name: string;
  ext: string;
  area: string;
  asteriskId: string;
}): Promise<UpdateSpeakerResult> {
  await requireAdmin();
  const name = input.name.trim();
  const ext = input.ext.trim();
  const area = input.area.trim();

  if (!name || !ext || !area || !input.asteriskId) {
    return { ok: false, error: 'required' };
  }
  if (!/^\d{3,6}$/.test(ext)) return { ok: false, error: 'ext_format' };

  const existing = await prisma.speaker.findUnique({
    where: { id: input.id },
    select: { id: true, projectId: true },
  });
  if (!existing) return { ok: false, error: 'not_found' };

  const [asterisk, dup] = await Promise.all([
    prisma.asterisk.findUnique({ where: { id: input.asteriskId }, select: { id: true } }),
    prisma.speaker.findUnique({
      where: { projectId_ext: { projectId: existing.projectId, ext } },
      select: { id: true },
    }),
  ]);
  if (!asterisk) return { ok: false, error: 'asterisk_missing' };
  if (dup && dup.id !== input.id) return { ok: false, error: 'ext_taken' };

  await prisma.speaker.update({
    where: { id: input.id },
    data: { name, ext, area, asteriskId: input.asteriskId },
  });

  revalidatePath('/[locale]/admin/projects', 'page');
  revalidatePath('/[locale]/admin/projects/[id]', 'page');
  revalidatePath('/[locale]/admin/dashboard', 'page');
  return { ok: true };
}

export type DeleteSpeakerResult = { ok: true } | { ok: false; error: 'not_found' };

export async function deleteSpeaker(id: string): Promise<DeleteSpeakerResult> {
  await requireAdmin();
  const existing = await prisma.speaker.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: 'not_found' };

  await prisma.speaker.delete({ where: { id } });

  revalidatePath('/[locale]/admin/projects', 'page');
  revalidatePath('/[locale]/admin/projects/[id]', 'page');
  revalidatePath('/[locale]/admin/dashboard', 'page');
  return { ok: true };
}
