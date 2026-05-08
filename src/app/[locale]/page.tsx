'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { landingForRole } from '@/lib/role';
import type { RoleId } from '@/lib/mock';
import DemoRibbon from '@/components/ui/DemoRibbon';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function LoginPage() {
  const t = useTranslations('login');
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await signIn('credentials', {
      username: username.trim(),
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (!res || res.error) {
      const code = res?.error ?? 'invalid_credentials';
      const map: Record<string, string> = {
        admin_blocked: t('errors.adminBlocked'),
        account_inactive: t('errors.inactive'),
        invalid_credentials: t('errors.invalid'),
      };
      setError(map[code] ?? t('errors.invalid'));
      return;
    }

    const session = await fetch('/api/auth/session').then(r => r.json());
    const role = session?.user?.role as RoleId | undefined;
    router.push(role ? landingForRole(role) : '/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <DemoRibbon />

      <div className="w-full max-w-md">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-900 text-white shadow-lg mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">{t('username')}</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="somphong"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm"
          >
            {submitting ? t('submitting') : t('submit')}
          </button>

          <p className="text-xs text-slate-500 text-center pt-2 border-t border-slate-100">
            {t('demoHint')}
          </p>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">{t('footer')}</p>
      </div>
    </div>
  );
}
