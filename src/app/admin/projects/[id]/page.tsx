'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import Avatar from '@/components/ui/Avatar';
import OnlinePill from '@/components/ui/OnlinePill';
import StatCard from '@/components/ui/StatCard';
import StatusPill from '@/components/ui/StatusPill';
import { PROJECTS, ROLE_LABEL, SPEAKERS, USERS } from '@/lib/mock';

const ROLE_BADGE: Record<string, string> = {
  authority: 'bg-red-500/15 text-red-400',
  officer: 'bg-blue-500/15 text-blue-400',
  headVillage: 'bg-green-500/15 text-green-400',
};

type Tab = 'accounts' | 'speakers' | 'usage';

export default function AdminProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>('accounts');
  const project = PROJECTS.find(p => p.id === id) || PROJECTS[0];

  const accountsInProj = USERS.filter(u => u.projectId === project.id);
  const speakersInProj = SPEAKERS.filter(s => s.projectId === project.id);
  const headVillages = accountsInProj.filter(u => u.role === 'headVillage').length;

  const infoCards = [
    { label: 'ผู้ใช้', value: `${accountsInProj.length}`, hint: `${headVillages} ผู้ใหญ่บ้าน` },
    { label: 'จุดประกาศ', value: `${speakersInProj.length}`, hint: `${speakersInProj.filter(s => s.online).length} ออนไลน์` },
    { label: 'Storage MP3', value: '2.1 GB', hint: 'ใช้งานล่าสุด' },
  ];

  return (
    <AdminShell>
      <Link href="/admin/projects" className="text-sm text-slate-400 hover:text-white">← กลับไปยังรายการโครงการ</Link>

      <div className="flex items-start justify-between gap-3 mt-3 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <StatusPill status={project.status} />
          </div>
          <div className="text-sm text-slate-400 mt-1">id: {project.id} · ติดต่อ: {project.contact} ({project.phone}) · สัญญา {project.contractStart} → {project.contractEnd}</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 border border-slate-600 hover:bg-slate-700 rounded-lg text-sm font-medium">แก้ไข</button>
          <button className="px-3 py-2 bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-lg text-sm font-medium">ระงับ</button>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {infoCards.map(c => (
          <StatCard key={c.label} variant="admin" label={c.label} value={c.value} hint={c.hint} />
        ))}
      </section>

      <div className="flex border-b border-white/10 mb-4">
        {(['accounts', 'speakers', 'usage'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 ${tab === t ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            {t === 'accounts' ? 'ผู้ใช้' : t === 'speakers' ? 'จุดประกาศ' : 'การใช้งาน'}
          </button>
        ))}
      </div>

      {tab === 'accounts' && (
        <section className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">ผู้ใช้ในโครงการ</h2>
            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ เพิ่มผู้ใช้</button>
          </div>
          <div className="space-y-2">
            {accountsInProj.length === 0 ? (
              <div className="admin-card text-slate-400">ยังไม่มีผู้ใช้ในโครงการนี้</div>
            ) : accountsInProj.map(u => {
              return (
                <div key={u.username} className="admin-card flex items-center gap-4 flex-wrap">
                  <Avatar name={u.name} tone="slate" size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white">{u.name}</div>
                    <div className="text-xs text-slate-400">{u.email} · @{u.username}</div>
                    {u.role === 'headVillage' && (
                      <div className="text-xs text-blue-400 mt-1">รับผิดชอบ {(u.assignedSpeakers || []).length} จุดประกาศ</div>
                    )}
                  </div>
                  <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${ROLE_BADGE[u.role] || 'bg-slate-500/15 text-slate-400'}`}>{ROLE_LABEL[u.role].name}</span>
                  <div className="flex gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded">✎</button>
                    <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded">🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'speakers' && (
        <section className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">จุดประกาศของโครงการ</h2>
            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ เพิ่มจุดประกาศ</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {speakersInProj.map(s => {
              const assignedTo = USERS.filter(u => u.role === 'headVillage' && (u.assignedSpeakers || []).includes(s.id));
              return (
                <div key={s.id} className="admin-card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{s.name}</div>
                      <div className="text-xs text-slate-400">Ext. {s.ext} · {s.area}</div>
                    </div>
                    <OnlinePill online={s.online} />
                  </div>
                  <div className={`text-xs ${assignedTo.length === 0 ? 'text-slate-500' : 'text-slate-300'}`}>
                    {assignedTo.length === 0 ? 'ยังไม่ได้ assign ให้ผู้ใหญ่บ้าน' : `→ ${assignedTo.map(u => u.name).join(', ')}`}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'usage' && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="admin-card">
            <div className="text-xs text-slate-400 uppercase tracking-wider">ประกาศเดือนนี้</div>
            <div className="text-3xl font-bold text-white mt-2">142</div>
            <div className="text-xs text-slate-500 mt-1">ครั้ง · +18% จากเดือนก่อน</div>
          </div>
          <div className="admin-card">
            <div className="text-xs text-slate-400 uppercase tracking-wider">เวลาประกาศรวม</div>
            <div className="text-3xl font-bold text-white mt-2">3 ชม. 25 น.</div>
            <div className="text-xs text-slate-500 mt-1">เฉลี่ย 1:27 ต่อครั้ง</div>
          </div>
          <div className="admin-card">
            <div className="text-xs text-slate-400 uppercase tracking-wider">พื้นที่ใช้งาน</div>
            <div className="text-3xl font-bold text-white mt-2">2.1 GB</div>
            <div className="text-xs text-slate-500 mt-1">MP3 + บันทึกการประกาศ</div>
          </div>
        </section>
      )}
    </AdminShell>
  );
}
