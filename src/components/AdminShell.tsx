'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { USERS, type User } from '@/lib/mock';
import { getCurrentUser } from '@/lib/role';
import DemoRibbon from '@/components/ui/DemoRibbon';

const NAV = [
  { href: '/admin/dashboard', label: '📊 Dashboard', match: '/admin/dashboard' },
  { href: '/admin/projects', label: '📁 โครงการ', match: '/admin/projects' },
  { href: '/admin/speakers', label: '🔊 จุดประกาศ', match: '/admin/speakers' },
  { href: '/admin/accounts', label: '👤 ผู้ใช้', match: '/admin/accounts' },
  { href: '/status', label: '⚙️ สถานะระบบ', match: '/status' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
              <div className="font-bold text-white">Admin Console</div>
              <div className="text-xs text-slate-400">Wireless PA · Vendor</div>
            </div>
          </div>
          <nav>
            {NAV.map(n => {
              const active = pathname.startsWith(n.match);
              return (
                <Link key={n.href} href={n.href} className={`admin-nav ${active ? 'active' : ''}`}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-8 pt-4 border-t border-white/10 px-2">
            <div className="text-xs text-slate-400 mb-1">เข้าสู่ระบบในชื่อ</div>
            <div className="text-sm font-medium text-white">{me ? me.name : '—'}</div>
            <div className="text-xs text-slate-400">{me ? me.email : '—'}</div>
            <Link href="/" className="block mt-3 text-xs text-slate-300 hover:text-white">→ ออกจากระบบ</Link>
          </div>
        </aside>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
