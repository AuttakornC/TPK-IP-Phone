'use client';

import Link from 'next/link';
import { useState } from 'react';
import AdminShell from '@/components/AdminShell';
import Avatar from '@/components/ui/Avatar';
import { PROJECTS, ROLE_LABEL, USERS } from '@/lib/mock';

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-slate-500/15 text-slate-300',
  authority: 'bg-red-500/15 text-red-400',
  officer: 'bg-blue-500/15 text-blue-400',
  headVillage: 'bg-green-500/15 text-green-400',
};

export default function AdminAccountsPage() {
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const list = USERS.filter(u => u.role !== 'admin').filter(u => {
    if (filterProject && u.projectId !== filterProject) return false;
    if (filterRole && u.role !== filterRole) return false;
    if (search && !(u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">ผู้ใช้ทั้งหมด</h1>
          <p className="text-sm text-slate-400 mt-1">จัดการผู้ใช้ทุกโครงการ · กำหนดบทบาทและ assign จุดประกาศ</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ เพิ่มผู้ใช้</button>
      </div>

      <div className="admin-card mb-4 flex items-center gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..." className="px-3 py-2 rounded-lg text-sm w-72" />
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2 rounded-lg text-sm">
          <option value="">ทุกโครงการ</option>
          {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-3 py-2 rounded-lg text-sm">
          <option value="">ทุก role</option>
          <option value="authority">ผู้บริหาร</option>
          <option value="officer">เจ้าหน้าที่</option>
          <option value="headVillage">ผู้ใหญ่บ้าน</option>
        </select>
      </div>

      <section className="admin-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold">ผู้ใช้</th>
              <th className="px-3 py-2 font-semibold">บทบาท</th>
              <th className="px-3 py-2 font-semibold">โครงการ</th>
              <th className="px-3 py-2 font-semibold">จุดที่รับผิดชอบ</th>
              <th className="px-3 py-2 font-semibold">เข้าใช้ล่าสุด</th>
              <th className="px-3 py-2 font-semibold">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">ไม่พบผู้ใช้</td></tr>
            ) : list.map(u => {
              const proj = PROJECTS.find(p => p.id === u.projectId);
              return (
                <tr key={u.username} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} tone="slate" />
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">{u.name}</div>
                        <div className="text-xs text-slate-500 truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role].name}</span>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {proj ? (
                      <Link href={`/admin/projects/${proj.id}`} className="text-blue-400 hover:underline">{proj.name}</Link>
                    ) : (
                      <span className="text-slate-500">— vendor —</span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-slate-300">{(u.assignedSpeakers || []).length > 0 ? `${u.assignedSpeakers.length} จุด` : '—'}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-400">{u.last}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded">✎</button>
                      <button className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded">🔑</button>
                      <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded">🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
