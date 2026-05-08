import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { USERS, type RoleId } from '@/lib/mock';

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
        const username = String(credentials?.username ?? '').trim();
        const password = String(credentials?.password ?? '');
        if (!username || !password) throw new Error('invalid_credentials');

        const user = USERS.find(u => u.username === username);
        if (!user) throw new Error('invalid_credentials');

        // Admin signs in via a separate surface — block here.
        if (user.role === 'admin') throw new Error('admin_blocked');

        if (!user.active) throw new Error('account_inactive');

        const expected = process.env.DEMO_LOGIN_PASSWORD || 'demo1234';
        if (password !== expected) throw new Error('invalid_credentials');

        return {
          id: user.username,
          name: user.name,
          username: user.username,
          role: user.role,
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
        const username = String(credentials?.username ?? '').trim();
        const password = String(credentials?.password ?? '');
        if (!username || !password) throw new Error('invalid_credentials');

        const user = USERS.find(u => u.username === username);
        if (!user) throw new Error('invalid_credentials');

        // Only admin accounts are allowed through this surface.
        if (user.role !== 'admin') throw new Error('not_admin');

        if (!user.active) throw new Error('account_inactive');

        const expected = process.env.DEMO_LOGIN_PASSWORD || 'demo1234';
        if (password !== expected) throw new Error('invalid_credentials');

        return {
          id: user.username,
          name: user.name,
          username: user.username,
          role: user.role,
          projectId: user.projectId,
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
