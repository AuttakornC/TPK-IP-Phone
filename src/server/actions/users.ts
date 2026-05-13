'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/server/auth';
import type { RoleId } from '@/lib/mock';

const DB_ROLE = {
  authority: 'AUTHORITY',
  officer: 'OFFICER',
  headVillage: 'HEAD_VILLAGE',
} as const satisfies Record<Exclude<RoleId, 'admin'>, 'AUTHORITY' | 'OFFICER' | 'HEAD_VILLAGE'>;

const ROLE_FROM_DB = {
  AUTHORITY: 'authority',
  OFFICER: 'officer',
  HEAD_VILLAGE: 'headVillage',
} as const satisfies Record<'AUTHORITY' | 'OFFICER' | 'HEAD_VILLAGE', Exclude<RoleId, 'admin'>>;

export interface ProjectUserRow {
  id: string;
  name: string;
  username: string;
  role: Exclude<RoleId, 'admin'>;
  active: boolean;
  assignedSpeakerIds: string[];
  credentials: { asteriskId: string; ext: string; password: string } | null;
}

export async function listProjectUsers(projectId: string): Promise<ProjectUserRow[]> {
  await requireAdmin();
  const rows = await prisma.user.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    include: {
      asterisk: true,
      assignedSpeakers: { select: { speakerId: true } },
    },
  });
  return rows.map(u => ({
    id: u.id,
    name: u.name,
    username: u.username,
    role: ROLE_FROM_DB[u.role],
    active: u.active,
    assignedSpeakerIds: u.assignedSpeakers.map(a => a.speakerId),
    credentials: u.asterisk
      ? { asteriskId: u.asterisk.asteriskId, ext: u.asterisk.ext, password: u.asterisk.password }
      : null,
  }));
}

export type CreateUserResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error:
        | 'required'
        | 'username_format'
        | 'username_taken'
        | 'ext_format'
        | 'ext_taken'
        | 'login_password_short'
        | 'asterisk_missing';
    };

export async function createUserWithAsterisk(input: {
  projectId: string;
  name: string;
  username: string;
  role: Exclude<RoleId, 'admin'>;
  asteriskId: string;
  ext: string;
  password: string;
  loginPassword: string;
  assignedSpeakerIds: string[];
}): Promise<CreateUserResult> {
  await requireAdmin();
  const name = input.name.trim();
  const username = input.username.trim().toLowerCase();
  const ext = input.ext.trim();
  const password = input.password.trim();
  const loginPassword = input.loginPassword.trim();

  if (!name || !username || !input.asteriskId || !ext || !password || !loginPassword) {
    return { ok: false, error: 'required' };
  }
  if (!/^[a-z0-9_.-]{3,}$/.test(username)) return { ok: false, error: 'username_format' };
  if (!/^\d{3,6}$/.test(ext)) return { ok: false, error: 'ext_format' };
  if (loginPassword.length < 6) return { ok: false, error: 'login_password_short' };

  const [usernameDup, extDup, asteriskExists] = await Promise.all([
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
    prisma.userAsterisk.findUnique({ where: { ext }, select: { id: true } }),
    prisma.asterisk.findUnique({ where: { id: input.asteriskId }, select: { id: true } }),
  ]);
  if (usernameDup) return { ok: false, error: 'username_taken' };
  if (extDup) return { ok: false, error: 'ext_taken' };
  if (!asteriskExists) return { ok: false, error: 'asterisk_missing' };

  const loginHash = await bcrypt.hash(loginPassword, 10);

  const created = await prisma.$transaction(async tx => {
    const user = await tx.user.create({
      data: {
        name,
        username,
        passwordHash: loginHash,
        role: DB_ROLE[input.role],
        active: true,
        projectId: input.projectId,
      },
    });
    await tx.userAsterisk.create({
      data: {
        userId: user.id,
        asteriskId: input.asteriskId,
        ext,
        password,
      },
    });
    if (input.role === 'headVillage' && input.assignedSpeakerIds.length > 0) {
      await tx.speakerAssignment.createMany({
        data: input.assignedSpeakerIds.map(speakerId => ({
          userId: user.id,
          speakerId,
        })),
        skipDuplicates: true,
      });
    }
    return user;
  });

  revalidatePath('/[locale]/admin/projects/[id]', 'page');
  revalidatePath('/[locale]/admin/projects', 'page');
  revalidatePath('/[locale]/admin/dashboard', 'page');
  return { ok: true, id: created.id };
}

export type UpdateUserResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | 'required'
        | 'not_found'
        | 'ext_format'
        | 'ext_taken'
        | 'login_password_short'
        | 'asterisk_missing';
    };

export async function updateUser(input: {
  id: string;
  name: string;
  role: Exclude<RoleId, 'admin'>;
  asteriskId: string;
  ext: string;
  password: string;
  loginPassword: string;
  assignedSpeakerIds: string[];
}): Promise<UpdateUserResult> {
  await requireAdmin();
  const name = input.name.trim();
  const ext = input.ext.trim();
  const password = input.password.trim();
  const loginPassword = input.loginPassword;

  if (!name || !input.asteriskId || !ext || !password) {
    return { ok: false, error: 'required' };
  }
  if (!/^\d{3,6}$/.test(ext)) return { ok: false, error: 'ext_format' };
  if (loginPassword && loginPassword.trim().length < 6) {
    return { ok: false, error: 'login_password_short' };
  }

  const existing = await prisma.user.findUnique({
    where: { id: input.id },
    select: { id: true, asterisk: { select: { id: true } } },
  });
  if (!existing) return { ok: false, error: 'not_found' };

  const [extDup, asteriskExists] = await Promise.all([
    prisma.userAsterisk.findFirst({
      where: { ext, NOT: { userId: input.id } },
      select: { id: true },
    }),
    prisma.asterisk.findUnique({ where: { id: input.asteriskId }, select: { id: true } }),
  ]);
  if (extDup) return { ok: false, error: 'ext_taken' };
  if (!asteriskExists) return { ok: false, error: 'asterisk_missing' };

  const newLoginHash = loginPassword ? await bcrypt.hash(loginPassword.trim(), 10) : null;

  await prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id: input.id },
      data: {
        name,
        role: DB_ROLE[input.role],
        ...(newLoginHash ? { passwordHash: newLoginHash } : {}),
      },
    });
    if (existing.asterisk) {
      await tx.userAsterisk.update({
        where: { userId: input.id },
        data: { asteriskId: input.asteriskId, ext, password },
      });
    } else {
      await tx.userAsterisk.create({
        data: { userId: input.id, asteriskId: input.asteriskId, ext, password },
      });
    }
    await tx.speakerAssignment.deleteMany({ where: { userId: input.id } });
    if (input.role === 'headVillage' && input.assignedSpeakerIds.length > 0) {
      await tx.speakerAssignment.createMany({
        data: input.assignedSpeakerIds.map(speakerId => ({ userId: input.id, speakerId })),
        skipDuplicates: true,
      });
    }
  });

  revalidatePath('/[locale]/admin/projects/[id]', 'page');
  revalidatePath('/[locale]/admin/projects', 'page');
  revalidatePath('/[locale]/admin/dashboard', 'page');
  return { ok: true };
}

export type DeleteUserResult = { ok: true } | { ok: false; error: 'not_found' };

export async function deleteUser(id: string): Promise<DeleteUserResult> {
  await requireAdmin();
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: 'not_found' };

  await prisma.user.delete({ where: { id } });

  revalidatePath('/[locale]/admin/projects/[id]', 'page');
  revalidatePath('/[locale]/admin/projects', 'page');
  revalidatePath('/[locale]/admin/dashboard', 'page');
  return { ok: true };
}

export async function suggestNextExt(): Promise<string> {
  await requireAdmin();
  const taken = new Set((await prisma.userAsterisk.findMany({ select: { ext: true } })).map(r => r.ext));
  for (let n = 9001; n < 9999; n++) {
    const candidate = String(n);
    if (!taken.has(candidate)) return candidate;
  }
  return '9999';
}
