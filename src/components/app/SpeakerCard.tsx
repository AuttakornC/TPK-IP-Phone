'use client';

import { useTranslations } from 'next-intl';
import { type Speaker } from '@/lib/mock';
import MeterBar from '@/components/ui/MeterBar';
import OnlinePill from '@/components/ui/OnlinePill';

interface Props {
  speaker: Speaker;
  selected: boolean;
  onToggle: () => void;
  onCall: () => void;
}

export default function SpeakerCard({ speaker: s, selected, onToggle, onCall }: Props) {
  const t = useTranslations('speakerCard');
  const tZones = useTranslations('zones.labels');
  return (
    <div
      className={`speaker-card ${selected ? 'selected' : ''} ${!s.online ? 'offline' : ''} bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col gap-3`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 truncate">{s.name}</div>
          <div className="text-xs text-slate-500 mt-0.5">{t('extLine', { ext: s.ext, area: s.area, zone: tZones(s.zone) })}</div>
        </div>
        <label className="flex-shrink-0">
          <input
            type="checkbox"
            className="select-cb w-5 h-5 rounded border-slate-300 text-blue-700 cursor-pointer"
            checked={selected}
            disabled={!s.online}
            onChange={onToggle}
          />
        </label>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>🔊</span>
        <MeterBar value={s.volume} variant="ok" className="flex-1" />
        <span className="font-mono text-slate-600 w-8 text-right">{s.volume}%</span>
      </div>
      <div className="flex items-center justify-between">
        <OnlinePill online={s.online} variant="light" />
        <button
          disabled={!s.online}
          onClick={() => s.online && onCall()}
          className={s.online
            ? 'px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed'}
        >
          {t('callBtn')}
        </button>
      </div>
    </div>
  );
}
