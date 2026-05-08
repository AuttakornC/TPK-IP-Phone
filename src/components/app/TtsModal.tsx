'use client';

import Modal from '@/components/ui/Modal';

interface Props {
  open: boolean;
  text: string;
  onTextChange: (v: string) => void;
  onClose: () => void;
  onSend: () => void;
}

export default function TtsModal({ open, text, onTextChange, onClose, onSend }: Props) {
  return (
    <Modal open={open} onClose={onClose} variant="admin" size="lg">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">ประกาศข้อความ (Text-to-Speech)</h3>
            <p className="text-sm text-slate-500">พิมพ์ข้อความ ระบบจะอ่านเสียงไทยผ่านลำโพง</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <textarea
          rows={4}
          value={text}
          onChange={e => onTextChange(e.target.value)}
          placeholder="เช่น: ขอเชิญประชาชนหมู่ 3 มารับเอกสารบัตรสวัสดิการแห่งรัฐ ที่ที่ทำการเทศบาล วันพฤหัสบดีนี้ เวลา 09:00 น."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
        />
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
          <label className="flex items-center gap-2"><span className="text-slate-600">เสียง:</span>
            <select className="border border-slate-200 rounded px-2 py-1"><option>หญิงไทย — ปกติ</option><option>ชายไทย — ปกติ</option><option>หญิงไทย — ทางการ</option></select>
          </label>
          <label className="flex items-center gap-2"><span className="text-slate-600">ความเร็ว:</span>
            <select className="border border-slate-200 rounded px-2 py-1"><option>ปกติ</option><option>ช้า</option><option>เร็ว</option></select>
          </label>
          <label className="flex items-center gap-2 ml-auto"><input type="checkbox" className="rounded border-slate-300" /><span className="text-slate-600">เล่นซ้ำ 2 รอบ</span></label>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">ฟังตัวอย่าง</button>
          <button onClick={onSend} className="flex-1 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-bold">ประกาศผ่านลำโพง</button>
        </div>
      </div>
    </Modal>
  );
}
