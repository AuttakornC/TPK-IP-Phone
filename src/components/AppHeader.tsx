'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { ROLE_LABEL, type Project, type RoleId, type User } from '@/lib/mock';
import { getCurrentProject, getCurrentRole, getCurrentUser, roleBadgeClass } from '@/lib/role';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

type NavFlag = 'op' | 'mp3' | 'scheduler' | 'log' | 'status' | 'users';
type NavItem = { href: string; flag: NavFlag; key: 'control' | 'mp3' | 'scheduler' | 'log' | 'status' | 'users' };

const NAV: NavItem[] = [
  { href: '/app', flag: 'op', key: 'control' },
  { href: '/mp3', flag: 'mp3', key: 'mp3' },
  { href: '/scheduler', flag: 'scheduler', key: 'scheduler' },
  { href: '/log', flag: 'log', key: 'log' },
  { href: '/status', flag: 'status', key: 'status' },
  { href: '/users', flag: 'users', key: 'users' },
];

export default function AppHeader() {
  const pathname = usePathname();
  const tNav = useTranslations('header.nav');
  const tHeader = useTranslations('header');
  const tCommon = useTranslations('common');
  const tRoles = useTranslations('roles');
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [role, setRole] = useState<RoleId>('authority');

  useEffect(() => {
    setUser(getCurrentUser());
    setProject(getCurrentProject());
    setRole(getCurrentRole());
  }, []);

  const visibleNav = NAV.filter(n => !(role === 'officer' && n.flag === 'users'));
  const r = ROLE_LABEL[role];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight">{tCommon('appName')}</div>
              <div className="text-xs text-slate-500 truncate max-w-[180px] sm:max-w-none">
                {project ? tHeader('projectLabel', { name: project.name }) : tCommon('dash')}
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-0.5">
            {visibleNav.map(n => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`nav-link ${active ? 'active' : ''} px-3 py-2 text-sm font-medium border-b-2 border-transparent text-slate-700 hover:text-blue-700`}
                >
                  {tNav(n.key)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
              <span className="pulse-dot"></span> {tCommon('connected')}
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-slate-800">{user ? user.name : tCommon('dash')}</div>
              <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded ring-1 ${roleBadgeClass(role)}`}>
                {r ? tRoles(`${role}.name`) : role}
              </span>
            </div>
            <Link href="/" className="text-sm text-slate-500 hover:text-red-600" title={tCommon('logout')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
