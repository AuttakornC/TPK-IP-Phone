type Tone = 'blue' | 'slate';
type Size = 'sm' | 'md';

const TONE: Record<Tone, string> = {
  blue: 'bg-blue-100 text-blue-700',
  slate: 'bg-slate-700 text-slate-200',
};

const SIZE: Record<Size, string> = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-base',
};

function initialsOf(name: string): string {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('');
}

interface Props {
  name: string;
  tone?: Tone;
  size?: Size;
}

export default function Avatar({ name, tone = 'blue', size = 'sm' }: Props) {
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 ${TONE[tone]} ${SIZE[size]}`}
    >
      {initialsOf(name)}
    </div>
  );
}
