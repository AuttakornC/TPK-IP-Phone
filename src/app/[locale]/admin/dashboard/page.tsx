'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AdminShell from '@/components/AdminShell';
import StatCard from '@/components/ui/StatCard';
import StatusPill from '@/components/ui/StatusPill';
import { PROJECTS, SPEAKERS, USERS } from '@/lib/mock';

const ACTIVITY = [
  { t: '2026-05-07 14:00', icon: '✨', key: 'newProject' },
  { t: '2026-05-06 10:15', icon: '👤', key: 'newUser' },
  { t: '2026-05-05 16:00', icon: '🔊', key: 'newSpeakers' },
  { t: '2026-05-04 09:30', icon: '⚠️', key: 'expiring' },
  { t: '2026-05-03 12:00', icon: '📝', key: 'renewed' },
] as const;

export default function AdminDashboardPage() {
  const t = useTranslations('adminDashboard');
  const tCommon = useTranslations('common');
  const totalAccounts = USERS.filter(u => u.role !== 'admin').length;
  const headVillages = USERS.filter(u => u.role === 'headVillage').length;
  const totalSpeakers = SPEAKERS.length;
  const onlineSpeakers = SPEAKERS.filter(s => s.online).length;
  const activeProjects = PROJECTS.filter(p => p.status === 'active').length;
  const expiring = PROJECTS.filter(p => p.status === 'expiring').length;

  const stats = [
    { label: t('stats.activeProjects'), value: `${activeProjects} / ${PROJECTS.length}`, hint: t('stats.expiringHint', { count: expiring }), color: '#60a5fa' },
    { label: t('stats.totalAccounts'), value: String(totalAccounts), hint: t('stats.headVillagesHint', { count: headVillages }), color: '#34d399' },
    { label: t('stats.speakers'), value: String(totalSpeakers), hint: t('stats.onlineHint', { count: onlineSpeakers }), color: '#fbbf24' },
  ];

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('subtitle')}</p>
        </div>
        <Link href="/admin/projects" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">{t('addProject')}</Link>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {stats.map(s => (
          <StatCard key={s.label} variant="admin" label={s.label} value={s.value} hint={s.hint} accent={s.color} />
        ))}
      </section>

      <section className="admin-card mb-6">
        <h2 className="text-lg font-bold mb-4">{t('recentEvents')}</h2>
        <ul className="space-y-3 text-sm">
          {ACTIVITY.map((a, i) => (
            <li key={i} className="flex items-start gap-3">
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-slate-200">{t(`activity.${a.key}`)}</div>
                <div className="text-xs text-slate-500 font-mono">{a.t}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{t('recentProjects')}</h2>
          <Link href="/admin/projects" className="text-sm text-blue-400 hover:underline">{tCommon('viewAll')}</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2 font-semibold">{t('tableHeader.project')}</th>
                <th className="px-3 py-2 font-semibold">{t('tableHeader.status')}</th>
                <th className="px-3 py-2 font-semibold">{t('tableHeader.users')}</th>
                <th className="px-3 py-2 font-semibold">{t('tableHeader.speakers')}</th>
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
                    <td className="px-3 py-3"><StatusPill status={p.status} /></td>
                    <td className="px-3 py-3 font-mono">{accounts}</td>
                    <td className="px-3 py-3 font-mono">{speakers}</td>
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
