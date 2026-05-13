import 'server-only';

import { getServerSession } from 'next-auth/next';
import { getLocale } from 'next-intl/server';
import { authOptions } from '@/auth';
import { redirect } from '@/i18n/navigation';

/**
 * Server-side admin gate. Use at the top of every admin server action and
 * every admin server-component page. Throws (via redirect) if the caller is
 * not an authenticated admin.
 *
 * Note: the demo role-selector on the landing page does NOT create a NextAuth
 * session — admin must sign in through `/admin/login` for these checks to
 * pass.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    const locale = await getLocale();
    redirect({ href: '/admin/login', locale });
  }
  return session;
}
