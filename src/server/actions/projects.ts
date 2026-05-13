'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/server/auth';
import type { ProjectStatus as MockProjectStatus } from '@/lib/mock';

const STATUS_TO_DB = {
  active: 'ACTIVE',
  expiring: 'EXPIRING',
  expired: 'EXPIRED',
} as const satisfies Record<MockProjectStatus, 'ACTIVE' | 'EXPIRING' | 'EXPIRED'>;

const STATUS_FROM_DB = {
  ACTIVE: 'active',
  EXPIRING: 'expiring',
  EXPIRED: 'expired',
} as const satisfies Record<'ACTIVE' | 'EXPIRING' | 'EXPIRED', MockProjectStatus>;

export interface ProjectRow {
  id: string;
  name: string;
  status: MockProjectStatus;
  userCount: number;
  speakerCount: number;
}

export async function listProjects(): Promise<ProjectRow[]> {
  await requireAdmin();
  const rows = await prisma.project.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { users: true, speakers: true } },
    },
  });
  return rows.map(p => ({
    id: p.id,
    name: p.name,
    status: STATUS_FROM_DB[p.status],
    userCount: p._count.users,
    speakerCount: p._count.speakers,
  }));
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  await requireAdmin();
  const p = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, speakers: true } },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    status: STATUS_FROM_DB[p.status],
    userCount: p._count.users,
    speakerCount: p._count.speakers,
  };
}

export async function nextProjectId(): Promise<string> {
  await requireAdmin();
  const rows = await prisma.project.findMany({ select: { id: true } });
  const ids = new Set(rows.map(r => r.id));
  let n = 1;
  while (ids.has(`p${n}`)) n++;
  return `p${n}`;
}

export type CreateProjectResult =
  | { ok: true; id: string }
  | { ok: false; error: 'name_required' | 'name_taken' };

export async function createProject(input: {
  name: string;
  status: MockProjectStatus;
}): Promise<CreateProjectResult> {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'name_required' };

  const dup = await prisma.project.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });
  if (dup) return { ok: false, error: 'name_taken' };

  const id = await nextProjectId();
  await prisma.project.create({
    data: { id, name, status: STATUS_TO_DB[input.status] },
  });

  revalidatePath('/[locale]/admin/projects', 'page');
  revalidatePath('/[locale]/admin/dashboard', 'page');
  return { ok: true, id };
}

export type UpdateProjectResult =
  | { ok: true }
  | { ok: false; error: 'name_required' | 'name_taken' | 'not_found' };

export async function updateProject(input: {
  id: string;
  name: string;
  status: MockProjectStatus;
}): Promise<UpdateProjectResult> {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'name_required' };

  const existing = await prisma.project.findUnique({ where: { id: input.id }, select: { id: true } });
  if (!existing) return { ok: false, error: 'not_found' };

  const dup = await prisma.project.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, NOT: { id: input.id } },
    select: { id: true },
  });
  if (dup) return { ok: false, error: 'name_taken' };

  await prisma.project.update({
    where: { id: input.id },
    data: { name, status: STATUS_TO_DB[input.status] },
  });

  revalidatePath('/[locale]/admin/projects', 'page');
  revalidatePath('/[locale]/admin/projects/[id]', 'page');
  revalidatePath('/[locale]/admin/dashboard', 'page');
  return { ok: true };
}

export type DeleteProjectResult = { ok: true } | { ok: false; error: 'not_found' };

export async function deleteProject(id: string): Promise<DeleteProjectResult> {
  await requireAdmin();
  const existing = await prisma.project.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: 'not_found' };

  await prisma.project.delete({ where: { id } });

  revalidatePath('/[locale]/admin/projects', 'page');
  revalidatePath('/[locale]/admin/dashboard', 'page');
  return { ok: true };
}

export async function getProjectDeletionImpact(id: string): Promise<{
  userCount: number;
  speakerCount: number;
} | null> {
  await requireAdmin();
  const p = await prisma.project.findUnique({
    where: { id },
    include: { _count: { select: { users: true, speakers: true } } },
  });
  if (!p) return null;
  return { userCount: p._count.users, speakerCount: p._count.speakers };
}
