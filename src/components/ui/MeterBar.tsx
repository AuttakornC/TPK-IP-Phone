type Variant = 'auto' | 'ok' | 'warn' | 'danger';

function autoVariant(pct: number): 'ok' | 'warn' | 'danger' {
  return pct < 50 ? 'ok' : pct < 80 ? 'warn' : 'danger';
}

interface Props {
  value: number;
  variant?: Variant;
  trackStyle?: React.CSSProperties;
  className?: string;
}

export default function MeterBar({ value, variant = 'auto', trackStyle, className = '' }: Props) {
  const v = variant === 'auto' ? autoVariant(value) : variant;
  return (
    <div className={`meter-track ${className}`} style={trackStyle}>
      <div className={`meter-fill ${v}`} style={{ width: `${value}%` }} />
    </div>
  );
}
