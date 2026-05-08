'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export default function LanguageSwitcher({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('languages');

  const baseClass =
    tone === 'dark'
      ? 'bg-slate-800 border-slate-700 text-slate-200'
      : 'bg-white border-slate-300 text-slate-700';

  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={e => router.replace(pathname, { locale: e.target.value })}
      className={`text-xs px-2 py-1.5 rounded-lg border cursor-pointer ${baseClass}`}
    >
      {routing.locales.map(l => (
        <option key={l} value={l}>
          {t(l)}
        </option>
      ))}
    </select>
  );
}
