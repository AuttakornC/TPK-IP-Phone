'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/server/auth';

export interface AsteriskRow {
  id: string;
  name: string;
  domain: string;
  active: boolean;
  speakerCount: number;
  userAsteriskCount: number;
}

export async function listAsterisks(): Promise<AsteriskRow[]> {
  await requireAdmin();
  const rows = await prisma.asterisk.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { speakers: true, userAsterisks: true } },
    },
  });
  return rows.map(a => ({
    id: a.id,
    name: a.name,
    domain: a.domain,
    active: a.active,
    speakerCount: a._count.speakers,
    userAsteriskCount: a._count.userAsterisks,
  }));
}

export type SaveAsteriskResult =
  | { ok: true; id: string }
  | { ok: false; error: 'name_required' | 'domain_required' | 'domain_taken' };

export async function createAsterisk(input: {
  name: string;
  domain: string;
  active: boolean;
}): Promise<SaveAsteriskResult> {
  await requireAdmin();
  const name = input.name.trim();
  const domain = input.domain.trim().toLowerCase();
  if (!name) return { ok: false, error: 'name_required' };
  if (!domain) return { ok: false, error: 'domain_required' };

  const dup = await prisma.asterisk.findUnique({ where: { domain } });
  if (dup) return { ok: false, error: 'domain_taken' };

  const created = await prisma.asterisk.create({
    data: { name, domain, active: input.active },
  });

  revalidatePath('/[locale]/admin/asterisks', 'page');
  return { ok: true, id: created.id };
}

export async function updateAsterisk(input: {
  id: string;
  name: string;
  domain: string;
  active: boolean;
}): Promise<SaveAsteriskResult> {
  await requireAdmin();
  const name = input.name.trim();
  const domain = input.domain.trim().toLowerCase();
  if (!name) return { ok: false, error: 'name_required' };
  if (!domain) return { ok: false, error: 'domain_required' };

  const dup = await prisma.asterisk.findFirst({
    where: { domain, NOT: { id: input.id } },
    select: { id: true },
  });
  if (dup) return { ok: false, error: 'domain_taken' };

  await prisma.asterisk.update({
    where: { id: input.id },
    data: { name, domain, active: input.active },
  });

  revalidatePath('/[locale]/admin/asterisks', 'page');
  return { ok: true, id: input.id };
}

export type DeleteAsteriskResult =
  | { ok: true }
  | { ok: false; error: 'in_use'; speakerCount: number; userCount: number };

export async function deleteAsterisk(id: string): Promise<DeleteAsteriskResult> {
  await requireAdmin();
  const counts = await prisma.asterisk.findUnique({
    where: { id },
    include: {
      _count: { select: { speakers: true, userAsterisks: true } },
    },
  });
  if (!counts) return { ok: true };

  const speakers = counts._count.speakers;
  const users = counts._count.userAsterisks;
  if (speakers > 0 || users > 0) {
    return { ok: false, error: 'in_use', speakerCount: speakers, userCount: users };
  }

  await prisma.asterisk.delete({ where: { id } });
  revalidatePath('/[locale]/admin/asterisks', 'page');
  return { ok: true };
}
