'use client';

import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import MeterBar from '@/components/ui/MeterBar';
import StatCard from '@/components/ui/StatCard';
import StatusPill from '@/components/ui/StatusPill';
import TierBadge from '@/components/ui/TierBadge';
import { PACKAGE_TIERS, PROJECTS, SPEAKERS, USERS } from '@/lib/mock';

const ACTIVITY = [
  { t: '2026-05-07 14:00', icon: '✨', text: 'โครงการใหม่: เทศบาลตำบลบางสะพาน (Premium)' },
  { t: '2026-05-06 10:15', icon: '👤', text: 'เพิ่มผู้ใช้ใหม่: ลุงสมศักดิ์ (head village) ในโครงการ p1' },
  { t: '2026-05-05 16:00', icon: '🔊', text: 'เพิ่มจุดประกาศ 3 จุดในโครงการ p2' },
  { t: '2026-05-04 09:30', icon: '⚠️', text: 'โครงการ p3 ใกล้หมดอายุ (24 วัน)' },
  { t: '2026-05-03 12:00', icon: '💰', text: 'ต่อสัญญา p2 อีก 1 ปี' },
];

export default function AdminDashboardPage() {
  const totalAccounts = USERS.filter(u => u.role !== 'admin').length;
  const headVillages = USERS.filter(u => u.role === 'headVillage').length;
  const totalSpeakers = SPEAKERS.length;
  const onlineSpeakers = SPEAKERS.filter(s => s.online).length;
  const activeProjects = PROJECTS.filter(p => p.status === 'active').length;
  const expiring = PROJECTS.filter(p => p.status === 'expiring').length;

  const stats = [
    { label: 'โครงการที่ใช้งาน', value: `${activeProjects} / ${PROJECTS.length}`, hint: `${expiring} ใกล้หมดอายุ`, color: '#60a5fa' },
    { label: 'ผู้ใช้ทั้งหมด', value: String(totalAccounts), hint: `${headVillages} ผู้ใหญ่บ้าน`, color: '#34d399' },
    { label: 'จุดประกาศ', value: String(totalSpeakers), hint: `${onlineSpeakers} ออนไลน์`, color: '#fbbf24' },
    { label: 'รายได้ประจำเดือน', value: '฿69,700', hint: '+12% จากเดือนก่อน', color: '#a78bfa' },
  ];

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">ภาพรวมระบบ</h1>
          <p className="text-sm text-slate-400 mt-1">จัดการโครงการ ผู้ใช้ และจุดประกาศของลูกค้าทั้งหมด</p>
        </div>
        <Link href="/admin/projects" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ เพิ่มโครงการ</Link>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <StatCard key={s.label} variant="admin" label={s.label} value={s.value} hint={s.hint} accent={s.color} />
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <section className="admin-card">
          <h2 className="text-lg font-bold mb-4">รายได้ตาม Package Tier</h2>
          <div className="space-y-3">
            {PACKAGE_TIERS.map(t => {
              const count = PROJECTS.filter(p => p.tier === t.id && p.status !== 'expired').length;
              const total = PROJECTS.filter(p => p.status !== 'expired').length;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={t.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TierBadge tier={t.id} />
                      <span className="text-xs text-slate-400">· {count} โครงการ</span>
                    </div>
                    <span className="text-sm font-mono text-slate-300">{t.price}</span>
                  </div>
                  <MeterBar value={pct} variant="ok" trackStyle={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="admin-card">
          <h2 className="text-lg font-bold mb-4">เหตุการณ์ล่าสุด</h2>
          <ul className="space-y-3 text-sm">
            {ACTIVITY.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-200">{a.text}</div>
                  <div className="text-xs text-slate-500 font-mono">{a.t}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="admin-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">โครงการล่าสุด</h2>
          <Link href="/admin/projects" className="text-sm text-blue-400 hover:underline">ดูทั้งหมด →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2 font-semibold">โครงการ</th>
                <th className="px-3 py-2 font-semibold">Tier</th>
                <th className="px-3 py-2 font-semibold">สถานะ</th>
                <th className="px-3 py-2 font-semibold">ผู้ใช้</th>
                <th className="px-3 py-2 font-semibold">จุดประกาศ</th>
                <th className="px-3 py-2 font-semibold">หมดอายุ</th>
              </tr>
            </thead>
            <tbody>
              {PROJECTS.map(p => {
                const accounts = USERS.filter(u => u.projectId === p.id).length;
                const speakers = SPEAKERS.filter(s => s.projectId === p.id).length;
                return (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="px-3 py-3">
                      <Link href={`/admin/projects/${p.id}`} className="text-blue-400 hover:underline font-medium">{p.name}</Link>
                    </td>
                    <td className="px-3 py-3"><TierBadge tier={p.tier} /></td>
                    <td className="px-3 py-3"><StatusPill status={p.status} /></td>
                    <td className="px-3 py-3 font-mono">{accounts}</td>
                    <td className="px-3 py-3 font-mono">{speakers}</td>
                    <td className="px-3 py-3 font-mono text-xs">{p.contractEnd}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
