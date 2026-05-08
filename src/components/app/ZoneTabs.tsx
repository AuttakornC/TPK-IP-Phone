import { ZONES } from '@/lib/mock';

interface Props {
  zone: string;
  onZoneChange: (zone: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  filteredCount: number;
  onlineCount: number;
  totalCount: number;
}

export default function ZoneTabs({
  zone,
  onZoneChange,
  search,
  onSearchChange,
  onSelectAll,
  onClear,
  filteredCount,
  onlineCount,
  totalCount,
}: Props) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold text-slate-900">จุดประกาศ</h2>
          <p className="text-xs text-slate-500">{filteredCount} จุดในมุมมองนี้ · {onlineCount}/{totalCount} จุดออนไลน์</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="ค้นหาจุดประกาศ..."
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-56 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
          />
          <button onClick={onSelectAll} className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap">เลือกทั้งหมด</button>
          <button onClick={onClear} className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap">ล้าง</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {ZONES.map(z => {
          const active = zone === z.id;
          return (
            <button
              key={z.id}
              onClick={() => onZoneChange(z.id)}
              className={`px-3.5 py-1.5 text-sm rounded-full border ${active ? 'bg-blue-900 text-white border-blue-900' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'}`}
            >
              {z.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
