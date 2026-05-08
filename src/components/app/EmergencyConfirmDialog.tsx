'use client';

import type { Emergency } from '@/lib/mock';
import Modal from '@/components/ui/Modal';
import { EMERGENCY_GLYPHS } from './types';

interface Props {
  emergency: Emergency | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function EmergencyConfirmDialog({ emergency, onCancel, onConfirm }: Props) {
  if (!emergency) return null;
  return (
    <Modal open onClose={onCancel} variant="admin" size="sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl">
            {EMERGENCY_GLYPHS[emergency.id] || '🚨'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">ยืนยันการประกาศ {emergency.name}?</h3>
            <p className="text-sm text-slate-500">เสียงไซเรนจะดังออกลำโพงทุกจุด · Ext. {emergency.ext}</p>
          </div>
        </div>
        {emergency.tts && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 mb-3 italic">
            🗣️ &quot;{emergency.tts}&quot;
          </div>
        )}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 mb-5">
          ⚠️ การกระทำนี้จะถูกบันทึกไว้ในระบบ พร้อมชื่อผู้ใช้และเวลา
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-medium hover:bg-slate-50">ยกเลิก</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">ยืนยัน — ประกาศ</button>
        </div>
      </div>
    </Modal>
  );
}
