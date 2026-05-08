type Variant = 'light' | 'admin';

interface Props {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  variant?: Variant;
}

export default function StatCard({ label, value, hint, accent, variant = 'light' }: Props) {
  if (variant === 'admin') {
    return (
      <div className="admin-card">
        <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
        <div className="text-3xl font-bold mt-2" style={accent ? { color: accent } : { color: '#fff' }}>
          {value}
        </div>
        {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent || 'text-slate-900'}`}>{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
