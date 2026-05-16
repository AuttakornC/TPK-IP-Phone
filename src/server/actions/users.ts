'use server';

import { promises as fs } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/server/auth';
import { MP3_DIR } from '@/lib/uploads';
import type { RoleId } from '@/lib/mock';

const DB_ROLE = {
  authority: 'AUTHORITY',
  officer: 'OFFICER',
  general: 'GENERAL',
} as const satisfies Record<Exclude<RoleId, 'admin'>, 'AUTHORITY' | 'OFFICER' | 'GENERAL'>;

const ROLE_FROM_DB = {
  AUTHORITY: 'authority',
  OFFICER: 'officer',
  GENERAL: 'general',
} as const satisfies Record<'AUTHORITY' | 'OFFICER' | 'GENERAL', Exclude<RoleId, 'admin'>>;

export interface ProjectUserRow {
  id: string;
  name: string;
  username: string;
  role: Exclude<RoleId, 'admin'>;
  active: boolean;
  assignedSpeakerIds: string[];
  credentials: { ext: string; password: string } | null;
}

export async function listProjectUsers(projectId: string): Promise<ProjectUserRow[]> {
  await requireAdmin();
  const rows = await prisma.user.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    include: {
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
    credentials: u.sipExt && u.sipPassword
      ? { ext: u.sipExt, password: u.sipPassword }
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
        | 'login_password_short';
    };

export async function createUserWithSipCredentials(input: {
  projectId: string;
  name: string;
  username: string;
  role: Exclude<RoleId, 'admin'>;
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

  if (!name || !username || !ext || !password || !loginPassword) {
    return { ok: false, error: 'required' };
  }
  if (!/^[a-z0-9_.-]{3,}$/.test(username)) return { ok: false, error: 'username_format' };
  if (!/^\d{3,6}$/.test(ext)) return { ok: false, error: 'ext_format' };
  if (loginPassword.length < 6) return { ok: false, error: 'login_password_short' };

  const [usernameDup, extDup] = await Promise.all([
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
    prisma.user.findUnique({ where: { sipExt: ext }, select: { id: true } }),
  ]);
  if (usernameDup) return { ok: false, error: 'username_taken' };
  if (extDup) return { ok: false, error: 'ext_taken' };

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
        sipExt: ext,
        sipPassword: password,
      },
    });
    if (input.role === 'general' && input.assignedSpeakerIds.length > 0) {
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
        | 'login_password_short';
    };

export async function updateUser(input: {
  id: string;
  name: string;
  role: Exclude<RoleId, 'admin'>;
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

  if (!name || !ext || !password) {
    return { ok: false, error: 'required' };
  }
  if (!/^\d{3,6}$/.test(ext)) return { ok: false, error: 'ext_format' };
  if (loginPassword && loginPassword.trim().length < 6) {
    return { ok: false, error: 'login_password_short' };
  }

  const existing = await prisma.user.findUnique({
    where: { id: input.id },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: 'not_found' };

  const extDup = await prisma.user.findFirst({
    where: { sipExt: ext, NOT: { id: input.id } },
    select: { id: true },
  });
  if (extDup) return { ok: false, error: 'ext_taken' };

  const newLoginHash = loginPassword ? await bcrypt.hash(loginPassword.trim(), 10) : null;

  await prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id: input.id },
      data: {
        name,
        role: DB_ROLE[input.role],
        sipExt: ext,
        sipPassword: password,
        ...(newLoginHash ? { passwordHash: newLoginHash } : {}),
      },
    });
    await tx.speakerAssignment.deleteMany({ where: { userId: input.id } });
    if (input.role === 'general' && input.assignedSpeakerIds.length > 0) {
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

  // DB rows cascade via Mp3File.userId; sweep the user's MP3 directory off disk too.
  await prisma.user.delete({ where: { id } });
  try {
    await fs.rm(path.join(MP3_DIR, id), { recursive: true, force: true });
  } catch {
    /* orphan files are tolerable — user row is already gone */
  }

  revalidatePath('/[locale]/admin/projects/[id]', 'page');
  revalidatePath('/[locale]/admin/projects', 'page');
  revalidatePath('/[locale]/admin/dashboard', 'page');
  return { ok: true };
}

export async function suggestNextExt(): Promise<string> {
  await requireAdmin();
  const taken = new Set(
    (await prisma.user.findMany({ where: { sipExt: { not: null } }, select: { sipExt: true } }))
      .map(r => r.sipExt!)
  );
  for (let n = 9001; n < 9999; n++) {
    const candidate = String(n);
    if (!taken.has(candidate)) return candidate;
  }
  return '9999';
}
