import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { RoleId } from '@/lib/mock';

const ROLE_FROM_DB = {
  AUTHORITY: 'authority',
  OFFICER: 'officer',
  GENERAL: 'general',
} as const satisfies Record<'AUTHORITY' | 'OFFICER' | 'GENERAL', Exclude<RoleId, 'admin'>>;

async function verifyPassword(supplied: string, hash: string | null): Promise<boolean> {
  if (hash) return bcrypt.compare(supplied, hash);
  // Fallback for accounts without a stored hash (e.g. legacy/demo data).
  const expected = process.env.DEMO_LOGIN_PASSWORD || 'demo1234';
  return supplied === expected;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/' },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? '').trim().toLowerCase();
        const password = String(credentials?.password ?? '');
        if (!username || !password) throw new Error('invalid_credentials');

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) throw new Error('invalid_credentials');
        if (!user.active) throw new Error('account_inactive');

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) throw new Error('invalid_credentials');

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          role: ROLE_FROM_DB[user.role],
          projectId: user.projectId,
        };
      },
    }),
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'admin-credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? '').trim().toLowerCase();
        const password = String(credentials?.password ?? '');
        if (!username || !password) throw new Error('invalid_credentials');

        const admin = await prisma.admin.findUnique({ where: { username } });
        if (!admin) throw new Error('invalid_credentials');
        if (!admin.active) throw new Error('account_inactive');

        const ok = await verifyPassword(password, admin.passwordHash);
        if (!ok) throw new Error('invalid_credentials');

        await prisma.admin.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: admin.id,
          name: admin.name,
          username: admin.username,
          role: 'admin',
          projectId: null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = (user as { username?: string }).username ?? token.username;
        token.role = (user as { role?: RoleId }).role ?? token.role;
        token.projectId = (user as { projectId?: string | null }).projectId ?? token.projectId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.username = token.username as string | undefined;
        session.user.role = token.role as RoleId | undefined;
        session.user.projectId = (token.projectId as string | null | undefined) ?? null;
      }
      return session;
    },
  },
};
