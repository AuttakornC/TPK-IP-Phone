'use client';

import { useRouter } from 'next/navigation';
import { DEMO_USER_BY_ROLE, PROJECTS, ROLES, USERS, type Role } from '@/lib/mock';
import { loginAsRole, loginAsUser } from '@/lib/role';
import DemoRibbon from '@/components/ui/DemoRibbon';

const ROLE_PALETTE: Record<string, { bg: string; text: string; border: string }> = {
  slate: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
};

const ROLE_BLURB: Record<string, string> = {
  admin: 'จัดการโครงการ ผู้ใช้ และจุดประกาศทั้งระบบ (ระดับ vendor)',
  authority: 'ผู้บริหารโครงการ — ใช้ได้ทุกฟังก์ชันในโครงการของตน',
  officer: 'ประกาศ ตั้งเวลา จัดการ MP3 และดู log ของโครงการ',
  headVillage: 'ผู้ใหญ่บ้าน — UI ใหญ่อ่านง่าย ใช้บนมือถือ ประกาศได้ทันที',
};

const ROLE_ICON: Record<string, string> = {
  admin: '🛠️',
  authority: '👔',
  officer: '📞',
  headVillage: '👴',
};

function RoleCard({ role, onClick }: { role: Role; onClick: () => void }) {
  const username = DEMO_USER_BY_ROLE[role.id];
  const u = USERS.find(x => x.username === username);
  const proj = u && u.projectId ? PROJECTS.find(p => p.id === u.projectId) : null;
  const pal = ROLE_PALETTE[role.color] || ROLE_PALETTE.slate;

  return (
    <button
      onClick={onClick}
      className={`text-left bg-white border-2 ${pal.border} rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition flex flex-col gap-3`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${pal.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
            {ROLE_ICON[role.id] || '👤'}
          </div>
          <div>
            <div className={`font-bold text-lg ${pal.text}`}>{role.name}</div>
            <div className="text-xs text-slate-500">{role.short}</div>
          </div>
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{ROLE_BLURB[role.id] || role.desc}</p>
      <div className="flex items-center gap-2 text-xs pt-2 border-t border-slate-100">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-700 truncate">{u ? u.name : '—'}</div>
          <div className="text-slate-500 truncate">{proj ? proj.name : role.id === 'admin' ? 'ผู้ดูแลระบบ (vendor)' : '—'}</div>
        </div>
        <span className={`${pal.text} font-bold text-lg`}>→</span>
      </div>
    </button>
  );
}

export default function RoleSelectorPage() {
  const router = useRouter();

  function pickRole(roleId: Role['id']) {
    const dest = loginAsRole(roleId);
    router.push(dest);
  }

  function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value.trim().toLowerCase();
    const u = USERS.find(x => x.email.toLowerCase() === email);
    if (!u) {
      alert('ไม่พบ email นี้ในระบบ — ลอง chanakarn.palipol@gmail.com (admin) หรือ mayor@bangsapan.go.th (authority)');
      return;
    }
    const dest = loginAsUser(u.username);
    if (dest) router.push(dest);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <DemoRibbon />

      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-900 text-white shadow-lg mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ระบบประกาศเสียงไร้สาย</h1>
          <p className="text-sm text-slate-500 mt-1">Wireless PA · เลือกมุมมองเพื่อดูเดโม</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {ROLES.map(r => (
            <RoleCard key={r.id} role={r} onClick={() => pickRole(r.id)} />
          ))}
        </div>

        <details className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <summary className="px-5 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 list-none flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            หรือ login ด้วย email (ระบบจริง)
          </summary>
          <div className="p-5 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500 mb-3">ในระบบจริง email จะกำหนดโครงการและบทบาทของผู้ใช้อัตโนมัติ</p>
            <form className="space-y-3" onSubmit={handleEmailLogin}>
              <input name="email" type="email" defaultValue="chanakarn.palipol@gmail.com" placeholder="email@example.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <input name="password" type="password" defaultValue="••••••••" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg text-sm">เข้าสู่ระบบ</button>
            </form>
          </div>
        </details>

        <p className="text-center text-xs text-slate-400 mt-6">© 2026 Wireless PA · Internal Use Only · v2.0 Multi-tenant</p>
      </div>
    </div>
  );
}
