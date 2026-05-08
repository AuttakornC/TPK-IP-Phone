'use client';

import Link from 'next/link';
import { useState } from 'react';
import AdminShell from '@/components/AdminShell';
import Modal from '@/components/ui/Modal';
import StatusPill from '@/components/ui/StatusPill';
import TierBadge from '@/components/ui/TierBadge';
import { PACKAGE_TIERS, PROJECTS, SPEAKERS, TIER_LABEL, USERS } from '@/lib/mock';

export default function AdminProjectsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [tierChoice, setTierChoice] = useState('standard');

  const filtered = PROJECTS.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || p.status === filterStatus) &&
    (!filterTier || p.tier === filterTier)
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
        <select value={filterTier} onChange={e => setFilterTier(e.target.value)} className="px-3 py-2 rounded-lg text-sm">
          <option value="">ทุก tier</option>
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => {
          const tier = TIER_LABEL[p.tier];
          const accounts = USERS.filter(u => u.projectId === p.id).length;
          const speakers = SPEAKERS.filter(s => s.projectId === p.id).length;
          return (
            <Link key={p.id} href={`/admin/projects/${p.id}`} className="admin-card hover:border-blue-500 transition block" style={{ textDecoration: 'none' }}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate" style={{ fontSize: 17 }}>{p.name}</div>
                  <div className="text-xs text-slate-500 font-mono">id: {p.id}</div>
                </div>
                <TierBadge tier={p.tier} />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-900 rounded-lg p-2">
                  <div className="text-xs text-slate-500">ผู้ใช้</div>
                  <div className="text-lg font-bold text-white">{accounts}</div>
                  <div className="text-[10px] text-slate-500">เพดาน {tier.maxHeadVillage} head village</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-2">
                  <div className="text-xs text-slate-500">จุดประกาศ</div>
                  <div className="text-lg font-bold text-white">{speakers}</div>
                  <div className="text-[10px] text-slate-500">เพดาน {tier.maxSpeakers} จุด</div>
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
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">เลือก Package</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PACKAGE_TIERS.map(t => (
                      <label key={t.id} className={`cursor-pointer rounded-xl border-2 p-3 text-center ${tierChoice === t.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                        <input type="radio" name="tier" value={t.id} className="sr-only" checked={tierChoice === t.id} onChange={() => setTierChoice(t.id)} />
                        <div className="font-bold text-slate-900">{t.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{t.price}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{t.maxSpeakers} จุด · {t.maxHeadVillage} ผู้ใหญ่บ้าน</div>
                      </label>
                    ))}
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
