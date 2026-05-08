'use client';

import AppHeader from '@/components/AppHeader';
import DemoRibbon from '@/components/ui/DemoRibbon';
import StatCard from '@/components/ui/StatCard';
import { LOG_ENTRIES, TYPE_LABEL } from '@/lib/mock';

export default function LogPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <DemoRibbon />
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">บันทึกการประกาศ</h1>
          <p className="text-sm text-slate-500">ประวัติการประกาศย้อนหลัง 90 วัน · บันทึกผู้ใช้ ปลายทาง และระยะเวลาทุกครั้ง</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="วันนี้" value="4" />
          <StatCard label="7 วันล่าสุด" value="28" />
          <StatCard label="เตือนภัย (เดือนนี้)" value="2" accent="text-red-600" />
          <StatCard label="ระยะเวลารวม" value="1ชม. 25น." />
        </div>

        <section className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ตั้งแต่</label>
            <input type="date" defaultValue="2026-05-01" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ถึง</label>
            <input type="date" defaultValue="2026-05-07" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ผู้ใช้</label>
            <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option>ทั้งหมด</option><option>นายก อบต.</option><option>ปลัด สมชาย</option><option>จนท. สมหญิง</option><option>ระบบอัตโนมัติ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ประเภท</label>
            <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option>ทั้งหมด</option><option>เตือนภัย</option><option>ประกาศกลุ่ม</option><option>จุดเดียว</option><option>ตั้งเวลา</option><option>MP3</option>
            </select>
          </div>
          <div className="flex-1"></div>
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium">ส่งออก CSV</button>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-600">
                  <th className="px-5 py-3 font-semibold">เวลา</th>
                  <th className="px-5 py-3 font-semibold">ผู้ใช้</th>
                  <th className="px-5 py-3 font-semibold">ปลายทาง</th>
                  <th className="px-5 py-3 font-semibold">ระยะเวลา</th>
                  <th className="px-5 py-3 font-semibold">ประเภท</th>
                  <th className="px-5 py-3 font-semibold">เสียงบันทึก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {LOG_ENTRIES.map((e, i) => {
                  const t = TYPE_LABEL[e.type];
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{e.time}</td>
                      <td className="px-5 py-3">{e.user}</td>
                      <td className="px-5 py-3 text-slate-700">{e.target}</td>
                      <td className="px-5 py-3 font-mono text-slate-600">{e.duration}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${t.class}`}>{t.text}</span>
                      </td>
                      <td className="px-5 py-3">
                        {e.recording ? (
                          <div className="flex items-center gap-1">
                            <button className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-medium">▶ ฟัง</button>
                            <button className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md" title="ดาวน์โหลด">⬇</button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>แสดง {LOG_ENTRIES.length} จาก 247 รายการ</span>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-slate-200 rounded text-slate-700 hover:bg-slate-50">ก่อนหน้า</button>
              <button className="px-3 py-1 border border-slate-200 rounded bg-blue-900 text-white">1</button>
              <button className="px-3 py-1 border border-slate-200 rounded text-slate-700 hover:bg-slate-50">2</button>
              <button className="px-3 py-1 border border-slate-200 rounded text-slate-700 hover:bg-slate-50">3</button>
              <button className="px-3 py-1 border border-slate-200 rounded text-slate-700 hover:bg-slate-50">ถัดไป</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
