import { ZONES } from '@/lib/mock';

interface Props {
  selectedCount: number;
  selectedNames: string;
  onCall: () => void;
  onSelectZone: (zoneId: string) => void;
}

export default function GroupCallSidebar({ selectedCount, selectedNames, onCall, onSelectZone }: Props) {
  return (
    <aside className="lg:sticky lg:top-24 self-start">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="font-bold text-slate-900">ประกาศพร้อมกัน</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">เลือกหลายจุดจาก list ด้านซ้าย แล้วกดประกาศ</p>

        <div className="bg-slate-50 rounded-xl p-3 mb-4">
          <div className="text-xs text-slate-500">จุดที่เลือก</div>
          <div className="text-3xl font-bold text-blue-900">{selectedCount}</div>
          <div className="text-xs text-slate-500">{selectedNames}</div>
        </div>

        <button
          onClick={onCall}
          disabled={selectedCount === 0}
          className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl mb-2 flex items-center justify-center gap-2 transition"
        >
          ประกาศพร้อมกัน
        </button>

        <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3 mt-2">
          <div className="font-semibold text-slate-700 mb-1">ปุ่มลัดเลือกตามโซน:</div>
          <div className="flex flex-wrap gap-1.5">
            {ZONES.filter(z => z.id !== 'all').map(z => (
              <button
                key={z.id}
                onClick={() => onSelectZone(z.id)}
                className="px-2 py-1 text-xs rounded-md bg-slate-100 hover:bg-blue-100 hover:text-blue-700"
              >
                {z.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
