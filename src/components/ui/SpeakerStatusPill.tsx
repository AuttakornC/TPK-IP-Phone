'use client';

import { useTranslations } from 'next-intl';
import type { SpeakerCallStatus } from '@/server/actions/speakers';

type Variant = 'admin' | 'light';

interface Props {
  status: SpeakerCallStatus;
  variant?: Variant;
}

export default function SpeakerStatusPill({ status, variant = 'admin' }: Props) {
  const t = useTranslations('speakerStatus');
  const label = t(status);
  const isBusy = status === 'busy';

  if (variant === 'light') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isBusy ? 'text-amber-700' : 'text-emerald-700'}`}>
        <span className={`w-2 h-2 rounded-full ${isBusy ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${
        isBusy ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'
      }`}
    >
      {isBusy ? '●' : '○'} {label}
    </span>
  );
}
