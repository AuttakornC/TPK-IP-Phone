type Variant = 'admin' | 'light';

interface Props {
  online: boolean;
  variant?: Variant;
}

export default function OnlinePill({ online, variant = 'admin' }: Props) {
  if (variant === 'light') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${online ? 'text-green-700' : 'text-slate-400'}`}>
        <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-slate-300'}`} />
        {online ? 'ออนไลน์' : 'ออฟไลน์'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${
        online ? 'bg-green-500/15 text-green-400' : 'bg-slate-500/15 text-slate-400'
      }`}
    >
      {online ? '● ออนไลน์' : '○ ออฟไลน์'}
    </span>
  );
}
