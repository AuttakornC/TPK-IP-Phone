'use client';

import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import Avatar from '@/components/ui/Avatar';
import DemoRibbon from '@/components/ui/DemoRibbon';
import { PERMISSION_MATRIX, ROLES, ROLE_LABEL, USERS, type RoleId, type User } from '@/lib/mock';
import { getCurrentUser } from '@/lib/role';

const ROLE_PALETTE: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  red: 'bg-red-100 text-red-700 ring-red-200',
  blue: 'bg-blue-100 text-blue-700 ring-blue-200',
  green: 'bg-green-100 text-green-700 ring-green-200',
  violet: 'bg-violet-100 text-violet-700 ring-violet-200',
};

function roleBadge(roleId: RoleId) {
  const r = ROLE_LABEL[roleId];
  const cls = ROLE_PALETTE[r.color] || ROLE_PALETTE.slate;
  return <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ring-1 ${cls}`}>{r.name}</span>;
}

function Cmark({ yes }: { yes: boolean }) {
  return (
    <td className="px-3 py-2.5 text-center">
      {yes ? (
        <span className="inline-flex w-6 h-6 rounded-full bg-green-100 text-green-700 items-center justify-center text-sm font-bold">✓</span>
      ) : (
        <span className="inline-flex w-6 h-6 rounded-full bg-slate-100 text-slate-400 items-center justify-center text-sm font-bold">—</span>
      )}
    </td>
  );
}

export default function UsersPage() {
  const [me, setMe] = useState<User | null>(null);

  useEffect(() => { setMe(getCurrentUser()); }, []);

  const visible = me && me.role === 'admin'
    ? USERS.filter(u => u.role !== 'admin')
    : USERS.filter(u => u.projectId === (me ? me.projectId : null));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <DemoRibbon />
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900">ผู้ใช้และสิทธิ์การใช้งาน</h1>
            <p className="text-sm text-slate-500">จัดการผู้ใช้และกำหนดบทบาท · เฉพาะนายก/ผู้บริหารเข้าหน้านี้ได้</p>
          </div>
          <button className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium text-sm flex items-center gap-2">+ เพิ่มผู้ใช้</button>
        </div>

        <section>
          <h2 className="font-bold text-slate-900 mb-3">บทบาท (Roles)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ROLES.map(r => {
              const count = USERS.filter(u => u.role === r.id && u.active).length;
              return (
                <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    {roleBadge(r.id)}
                    <span className="text-xs text-slate-500">{count} คน</span>
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed">{r.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">ตารางสิทธิ์</h2>
            <p className="text-xs text-slate-500 mt-0.5">สิ่งที่แต่ละบทบาททำได้ในระบบ</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-600">
                  <th className="px-5 py-3 text-left font-semibold">สิทธิ์</th>
                  <th className="px-3 py-3 text-center font-semibold">ผู้ดูแลระบบ</th>
                  <th className="px-3 py-3 text-center font-semibold">ผู้บริหาร</th>
                  <th className="px-3 py-3 text-center font-semibold">เจ้าหน้าที่</th>
                  <th className="px-3 py-3 text-center font-semibold">ผู้ใหญ่บ้าน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERMISSION_MATRIX.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 text-slate-800">{row.perm}</td>
                    <Cmark yes={row.admin} />
                    <Cmark yes={row.authority} />
                    <Cmark yes={row.officer} />
                    <Cmark yes={row.headVillage} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">ผู้ใช้ทั้งหมด</h2>
            <input type="text" placeholder="ค้นหา..." className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-48" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-600">
                  <th className="px-5 py-3 font-semibold">ชื่อ</th>
                  <th className="px-5 py-3 font-semibold">บทบาท</th>
                  <th className="px-5 py-3 font-semibold">อีเมล</th>
                  <th className="px-5 py-3 font-semibold">เข้าใช้ล่าสุด</th>
                  <th className="px-5 py-3 font-semibold">สถานะ</th>
                  <th className="px-5 py-3 font-semibold w-1">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map(u => {
                  return (
                    <tr key={u.username} className={u.active ? 'hover:bg-slate-50' : 'opacity-60 hover:bg-slate-50'}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} />
                          <div>
                            <div className="font-medium text-slate-900">{u.name}</div>
                            <div className="text-xs text-slate-500">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">{roleBadge(u.role)}</td>
                      <td className="px-5 py-3 text-slate-600">{u.email}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">{u.last}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ring-1 ${u.active ? 'bg-green-100 text-green-700 ring-green-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-green-500' : 'bg-slate-400'}`} />
                          {u.active ? 'ใช้งาน' : 'ระงับ'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="แก้ไข">✎</button>
                          <button className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg" title="รีเซ็ตรหัสผ่าน">🔑</button>
                          <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="ลบ">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
