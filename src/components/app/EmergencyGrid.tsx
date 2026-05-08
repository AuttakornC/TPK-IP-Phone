'use client';

import { useTranslations } from 'next-intl';
import { EMERGENCIES, type Emergency } from '@/lib/mock';
import { EMERGENCY_GLYPHS, EMERGENCY_PALETTE } from './types';

interface Props {
  onPick: (em: Emergency) => void;
}

export default function EmergencyGrid({ onPick }: Props) {
  const t = useTranslations('emergency');
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <span className="text-red-600">🚨</span> {t('title')}
          </h2>
          <p className="text-xs text-slate-500">{t('subtitle')}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {EMERGENCIES.map(em => {
          const p = EMERGENCY_PALETTE[em.palette] || EMERGENCY_PALETTE.red;
          return (
            <button
              key={em.id}
              onClick={() => onPick(em)}
              className={`emergency-btn ${p.bg} ${p.border} border-2 rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md`}
            >
              <div className={`w-12 h-12 rounded-xl ${p.iconBg} text-white flex items-center justify-center text-2xl mb-2 shadow`}>
                {EMERGENCY_GLYPHS[em.id] || '🚨'}
              </div>
              <div className={`font-bold ${p.text}`}>{t(`names.${em.id}`)}</div>
              <div className="text-xs text-slate-500 mt-0.5">{t('extLabel', { ext: em.ext })}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
