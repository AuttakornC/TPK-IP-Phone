'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import DemoRibbon from '@/components/ui/DemoRibbon';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function AdminLoginPage() {
  const t = useTranslations('adminLogin');
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await signIn('admin-credentials', {
      username: username.trim(),
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (!res || res.error) {
      const code = res?.error ?? 'invalid_credentials';
      const map: Record<string, string> = {
        not_admin: t('errors.notAdmin'),
        account_inactive: t('errors.inactive'),
        invalid_credentials: t('errors.invalid'),
      };
      setError(map[code] ?? t('errors.invalid'));
      return;
    }

    router.push('/admin/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f172a', color: '#e2e8f0' }}>
      <DemoRibbon />

      <div className="w-full max-w-md">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-700 text-white shadow-lg mb-4 text-xl font-bold">
            PA
          </div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('subtitle')}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4 border"
          style={{ background: '#1e293b', borderColor: '#334155' }}
        >
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">{t('username')}</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: '#0f172a', borderColor: '#334155', borderWidth: 1, color: '#e2e8f0' }}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">{t('password')}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: '#0f172a', borderColor: '#334155', borderWidth: 1, color: '#e2e8f0' }}
            />
          </div>

          {error && (
            <div
              className="text-sm rounded-lg px-3 py-2"
              role="alert"
              style={{ background: 'rgba(220, 38, 38, 0.15)', color: '#fecaca', border: '1px solid rgba(220, 38, 38, 0.4)' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-700 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm"
          >
            {submitting ? t('submitting') : t('submit')}
          </button>

          <p className="text-xs text-slate-400 text-center pt-2 border-t" style={{ borderColor: '#334155' }}>
            {t('demoHint')}
          </p>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">{t('footer')}</p>
      </div>
    </div>
  );
}
