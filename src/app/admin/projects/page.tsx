'use client';

import Link from 'next/link';
import { useState } from 'react';
import AdminShell from '@/components/AdminShell';
import Modal from '@/components/ui/Modal';
import StatusPill from '@/components/ui/StatusPill';
import { PROJECTS, SPEAKERS, USERS } from '@/lib/mock';

export default function AdminProjectsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = PROJECTS.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || p.status === filterStatus)
  );

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">โครงการทั้งหมด</h1>
          <p className="text-sm text-slate-400 mt-1">จัดการ tenant — สร้าง/แก้ไข/ระงับโครงการของลูกค้า</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ เพิ่มโครงการ</button>
      </div>

      <div className="admin-card mb-4 flex items-center gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อโครงการ..." className="px-3 py-2 rounded-lg text-sm w-72" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg text-sm">
          <option value="">ทุกสถานะ</option>
          <option value="active">ใช้งาน</option>
          <option value="expiring">ใกล้หมดอายุ</option>
          <option value="expired">หมดอายุ</option>
        </select>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => {
          const accounts = USERS.filter(u => u.projectId === p.id).length;
          const speakers = SPEAKERS.filter(s => s.projectId === p.id).length;
          return (
            <Link key={p.id} href={`/admin/projects/${p.id}`} className="admin-card hover:border-blue-500 transition block" style={{ textDecoration: 'none' }}>
              <div className="mb-3">
                <div className="font-bold text-white truncate" style={{ fontSize: 17 }}>{p.name}</div>
                <div className="text-xs text-slate-500 font-mono">id: {p.id}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-900 rounded-lg p-2">
                  <div className="text-xs text-slate-500">ผู้ใช้</div>
                  <div className="text-lg font-bold text-white">{accounts}</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-2">
                  <div className="text-xs text-slate-500">จุดประกาศ</div>
                  <div className="text-lg font-bold text-white">{speakers}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <StatusPill status={p.status} />
                <span className="text-slate-500 font-mono">{p.contractStart} → {p.contractEnd}</span>
              </div>
            </Link>
          );
        })}
      </section>

      <Modal open={showModal} onClose={() => setShowModal(false)} variant="admin" size="md">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">เพิ่มโครงการใหม่</h3>
              <p className="text-sm text-slate-500">กำหนดข้อมูลพื้นฐาน · สามารถ assign ผู้ใช้และจุดประกาศหลังบันทึก</p>
            </div>
            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-1">✕</button>
          </div>
          <form
            className="space-y-3"
            onSubmit={e => {
              e.preventDefault();
              setShowModal(false);
              alert('🎭 (เดโม) บันทึกแล้ว — โครงการจะถูกสร้างจริงตอน implement');
            }}
          >
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อโครงการ</label>
                  <input type="text" placeholder="เทศบาล... / อบต. ..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">เริ่มสัญญา</label>
                    <input type="date" defaultValue="2026-05-08" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">สิ้นสุดสัญญา</label>
                    <input type="date" defaultValue="2027-05-07" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ผู้ติดต่อ</label>
                    <input type="text" placeholder="ชื่อผู้ติดต่อ" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">โทรศัพท์</label>
                    <input type="tel" placeholder="032-555-1234" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-medium hover:bg-slate-50">ยกเลิก</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold">สร้างโครงการ</button>
                </div>
          </form>
        </div>
      </Modal>
    </AdminShell>
  );
}
