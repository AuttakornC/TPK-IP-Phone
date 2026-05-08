'use client';

import { useState } from 'react';
import AdminShell from '@/components/AdminShell';
import Modal from '@/components/ui/Modal';
import OnlinePill from '@/components/ui/OnlinePill';
import TierBadge from '@/components/ui/TierBadge';
import { PROJECTS, SPEAKERS, USERS, ZONE_LABEL } from '@/lib/mock';

export default function AdminSpeakersPage() {
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssign, setFilterAssign] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = SPEAKERS.filter(s => {
    if (filterProject && s.projectId !== filterProject) return false;
    if (filterStatus === 'online' && !s.online) return false;
    if (filterStatus === 'offline' && s.online) return false;
    const assigned = USERS.some(u => u.role === 'headVillage' && (u.assignedSpeakers || []).includes(s.id));
    if (filterAssign === 'assigned' && !assigned) return false;
    if (filterAssign === 'unassigned' && assigned) return false;
    if (search && !(s.name.toLowerCase().includes(search.toLowerCase()) || s.ext.includes(search))) return false;
    return true;
  });

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">จุดประกาศทั้งหมด</h1>
          <p className="text-sm text-slate-400 mt-1">สร้าง/แก้ไขจุดประกาศ และ assign ให้ผู้ใหญ่บ้านในแต่ละโครงการ</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ เพิ่มจุดประกาศ</button>
      </div>

      <div className="admin-card mb-4 flex items-center gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..." className="px-3 py-2 rounded-lg text-sm w-72" />
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2 rounded-lg text-sm">
          <option value="">ทุกโครงการ</option>
          {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg text-sm">
          <option value="">ทุกสถานะ</option>
          <option value="online">ออนไลน์</option>
          <option value="offline">ออฟไลน์</option>
        </select>
        <select value={filterAssign} onChange={e => setFilterAssign(e.target.value)} className="px-3 py-2 rounded-lg text-sm">
          <option value="">การ assign ทั้งหมด</option>
          <option value="assigned">ถูก assign แล้ว</option>
          <option value="unassigned">ยังไม่ได้ assign</option>
        </select>
      </div>

      <section className="admin-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold">ชื่อจุด</th>
              <th className="px-3 py-2 font-semibold">โครงการ</th>
              <th className="px-3 py-2 font-semibold">Ext.</th>
              <th className="px-3 py-2 font-semibold">โซน · พื้นที่</th>
              <th className="px-3 py-2 font-semibold">สถานะ</th>
              <th className="px-3 py-2 font-semibold">Assigned to</th>
              <th className="px-3 py-2 font-semibold">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-400">ไม่พบจุดประกาศ</td>
              </tr>
            ) : filtered.map(s => {
              const proj = PROJECTS.find(p => p.id === s.projectId);
              const assigned = USERS.filter(u => u.role === 'headVillage' && (u.assignedSpeakers || []).includes(s.id));
              return (
                <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-3 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-2">
                      {proj && <TierBadge tier={proj.tier} />}
                      <span className="text-slate-300 text-xs">{proj?.name}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-slate-300">{s.ext}</td>
                  <td className="px-3 py-3 text-slate-300">{ZONE_LABEL[s.zone]} · {s.area}</td>
                  <td className="px-3 py-3">
                    <OnlinePill online={s.online} />
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {assigned.length === 0 ? (
                      <button className="px-2 py-0.5 rounded border border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400">+ assign</button>
                    ) : (
                      <span className="text-slate-200">{assigned.map(u => u.name).join(', ')}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded">✎</button>
                      <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded">🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <Modal open={showModal} onClose={() => setShowModal(false)} variant="admin" size="md">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">เพิ่มจุดประกาศใหม่</h3>
              <p className="text-sm text-slate-500">ผูกกับโครงการ และเลือก assign ผู้ใหญ่บ้านได้ทันที</p>
            </div>
            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
              <form
                className="space-y-3"
                onSubmit={e => {
                  e.preventDefault();
                  setShowModal(false);
                  alert('🎭 (เดโม) บันทึกแล้ว');
                }}
              >
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อจุด</label>
                  <input type="text" placeholder="เช่น ศาลาประชาคม" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Extension</label>
                    <input type="text" placeholder="1001" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">โซน</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                      <option>โซนกลาง</option><option>โซนเหนือ</option><option>โซนใต้</option><option>โซนตะวันออก</option><option>โซนตะวันตก</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">โครงการ</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Assign ให้ผู้ใหญ่บ้าน (ไม่บังคับ)</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    <option value="">— ไม่ assign —</option>
                    {USERS.filter(u => u.role === 'headVillage').map(u => {
                      const proj = PROJECTS.find(p => p.id === u.projectId);
                      return <option key={u.username} value={u.username}>{u.name} ({proj?.name || '—'})</option>;
                    })}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-medium hover:bg-slate-50">ยกเลิก</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold">สร้างจุดประกาศ</button>
                </div>
          </form>
        </div>
      </Modal>
    </AdminShell>
  );
}
