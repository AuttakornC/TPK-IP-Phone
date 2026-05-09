'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { EmergencyPreset } from '@/lib/presetStore';
import { EMERGENCY_PALETTE } from './types';

interface Props {
  presets: EmergencyPreset[];
  onPick: (preset: EmergencyPreset) => void;
}

export default function EmergencyGrid({ presets, onPick }: Props) {
  const t = useTranslations('emergency');
  const tEmNames = useTranslations('emergency.names');

  function presetLabel(p: EmergencyPreset): string {
    if (p.custom) return p.name;
    if (tEmNames.has(p.id)) return tEmNames(p.id);
    return p.name;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <span className="text-red-600">🚨</span> {t('title')}
          </h2>
          <p className="text-xs text-slate-500">{t('subtitle')}</p>
        </div>
        <Link
          href="/presets"
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700"
        >
          {t('managePresets')}
        </Link>
      </div>
      {presets.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-sm text-slate-500">
          {t('emptyPresets')}{' '}
          <Link href="/presets" className="text-blue-700 font-medium">{t('managePresetsInline')}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {presets.map(em => {
            const p = EMERGENCY_PALETTE[em.palette] || EMERGENCY_PALETTE.red;
            return (
              <button
                key={em.id}
                onClick={() => onPick(em)}
                className={`emergency-btn ${p.bg} ${p.border} border-2 rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md`}
              >
                <div className={`w-12 h-12 rounded-xl ${p.iconBg} text-white flex items-center justify-center text-2xl mb-2 shadow`}>
                  {em.icon || '🚨'}
                </div>
                <div className={`font-bold ${p.text}`}>{presetLabel(em)}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t('extLabel', { ext: em.ext })}</div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
