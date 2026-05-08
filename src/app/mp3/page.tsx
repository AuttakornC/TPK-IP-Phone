'use client';

import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import DemoRibbon from '@/components/ui/DemoRibbon';
import { MP3_FILES } from '@/lib/mock';

export default function Mp3Page() {
  const [drag, setDrag] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <DemoRibbon />
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">ไฟล์เสียง MP3</h1>
            <p className="text-sm text-slate-500">อัปโหลดไฟล์เสียง เพื่อเปิดผ่านลำโพง หรือใช้ตั้งเวลาประกาศอัตโนมัติ</p>
          </div>
        </div>

        <div
          className={`dropzone ${drag ? 'dragover' : ''} bg-white border-2 border-dashed border-slate-300 rounded-2xl p-8 sm:p-12 text-center cursor-pointer hover:border-blue-400 transition`}
          onDragEnter={e => { e.preventDefault(); setDrag(true); }}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); }}
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="font-semibold text-slate-800">ลากไฟล์ MP3 มาวาง หรือคลิกเพื่อเลือก</div>
          <div className="text-xs text-slate-500 mt-1">รองรับ .mp3 ขนาดไม่เกิน 10 MB ต่อไฟล์</div>
          <button className="mt-4 px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium text-sm">เลือกไฟล์</button>
        </div>

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">ไฟล์ที่อัปโหลดแล้ว</h2>
            <div className="text-xs text-slate-500">{MP3_FILES.length} ไฟล์</div>
          </div>
          <ul className="divide-y divide-slate-100">
            {MP3_FILES.map(f => (
              <li key={f.name} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50">
                <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">▶</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{f.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{f.size} · {f.duration} · อัปโหลด {f.uploaded}</div>
                </div>
                <button className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">▶ ฟัง</button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">📡 เล่นผ่านลำโพง</button>
                <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="ลบ">🗑</button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
