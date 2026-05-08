'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { USERS, type User } from '@/lib/mock';
import { getCurrentUser } from '@/lib/role';
import DemoRibbon from '@/components/ui/DemoRibbon';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

const NAV: { href: string; key: 'dashboard' | 'projects' | 'speakers' | 'accounts' | 'status'; match: string }[] = [
  { href: '/admin/dashboard', key: 'dashboard', match: '/admin/dashboard' },
  { href: '/admin/projects', key: 'projects', match: '/admin/projects' },
  { href: '/admin/speakers', key: 'speakers', match: '/admin/speakers' },
  { href: '/admin/accounts', key: 'accounts', match: '/admin/accounts' },
  { href: '/status', key: 'status', match: '/status' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations('adminShell');
  const tCommon = useTranslations('common');
  const [me, setMe] = useState<User | null>(null);

  useEffect(() => {
    const u = getCurrentUser() || USERS.find(x => x.role === 'admin') || null;
    setMe(u);
  }, []);

  return (
    <div className="admin-body">
      <DemoRibbon />
      <div className="admin-shell">
        <aside className="admin-side">
          <div className="flex items-center gap-2 mb-6 px-2">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center text-sm font-bold">PA</div>
            <div>
              <div className="font-bold text-white">{t('consoleTitle')}</div>
              <div className="text-xs text-slate-400">{t('consoleSub')}</div>
            </div>
          </div>
          <nav>
            {NAV.map(n => {
              const active = pathname.startsWith(n.match);
              return (
                <Link key={n.href} href={n.href} className={`admin-nav ${active ? 'active' : ''}`}>
                  {t(`nav.${n.key}`)}
                </Link>
              );
            })}
          </nav>
          <div className="mt-8 pt-4 border-t border-white/10 px-2 space-y-3">
            <LanguageSwitcher tone="dark" />
            <div>
              <div className="text-xs text-slate-400 mb-1">{t('loggedInAs')}</div>
              <div className="text-sm font-medium text-white">{me ? me.name : tCommon('dash')}</div>
              <div className="text-xs text-slate-400">{me ? `@${me.username}` : tCommon('dash')}</div>
              <Link href="/" className="block mt-3 text-xs text-slate-300 hover:text-white">{t('logoutLink')}</Link>
            </div>
          </div>
        </aside>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
