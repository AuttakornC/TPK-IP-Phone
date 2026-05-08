import type { DefaultSession } from 'next-auth';
import type { RoleId } from '@/lib/mock';

declare module 'next-auth' {
  interface User {
    username?: string;
    role?: RoleId;
    projectId?: string | null;
  }

  interface Session {
    user: {
      username?: string;
      role?: RoleId;
      projectId?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string;
    role?: RoleId;
    projectId?: string | null;
  }
}
