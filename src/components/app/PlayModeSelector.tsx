'use client';

import { useTranslations } from 'next-intl';
import type { PlayMode } from '@/lib/presetStore';

const MODES: PlayMode[] = ['mp3', 'mp3-then-mic'];

interface Props {
  value: PlayMode;
  onChange: (mode: PlayMode) => void;
  /** Visual accent — emergency editor uses red, template editor uses blue. */
  accent?: 'red' | 'blue';
}

export default function PlayModeSelector({ value, onChange, accent = 'blue' }: Props) {
  const t = useTranslations('playMode');
  const activeRing = accent === 'red'
    ? 'border-red-500 bg-red-50 text-red-800'
    : 'border-blue-500 bg-blue-50 text-blue-800';

  return (
    <div>
      <span className="text-sm font-medium text-slate-700 block mb-2">{t('label')}</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {MODES.map(m => {
          const active = value === m;
          return (
            <label
              key={m}
              className={`cursor-pointer border-2 rounded-xl px-3 py-3 text-sm flex flex-col gap-1 transition ${
                active ? activeRing : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name={`play-mode-${accent}`}
                value={m}
                checked={active}
                onChange={() => onChange(m)}
                className="sr-only"
              />
              <span className="font-semibold flex items-center gap-2">
                <span className="text-lg">{m === 'mp3' ? '🎵' : '🎵→🎤'}</span>
                {t(`modes.${m}.label`)}
              </span>
              <span className="text-xs text-slate-500">{t(`modes.${m}.desc`)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
