'use client';

import { useTranslations } from 'next-intl';
import type { EmergencyPreset } from '@/lib/presetStore';
import Modal from '@/components/ui/Modal';
import { EMERGENCY_GLYPHS } from './types';

interface Props {
  emergency: EmergencyPreset | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function EmergencyConfirmDialog({ emergency, onCancel, onConfirm }: Props) {
  const t = useTranslations('emergency');
  const tCommon = useTranslations('common');
  if (!emergency) return null;

  const name = !emergency.custom && t.has(`names.${emergency.id}`)
    ? t(`names.${emergency.id}`)
    : emergency.name;
  const mp3Hint = emergency.mp3Name
    ? t('mp3Hint', { name: emergency.mp3Name })
    : t('mp3DefaultTone');

  return (
    <Modal open onClose={onCancel} variant="admin" size="sm">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl">
            {emergency.icon || EMERGENCY_GLYPHS[emergency.id] || '🚨'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('confirmTitle', { name })}</h3>
            <p className="text-sm text-slate-500">{t('confirmSub', { ext: emergency.ext })}</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700">
          🔊 {mp3Hint}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          {t('warning')}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-medium hover:bg-slate-50">{tCommon('cancel')}</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">{t('confirmBtn')}</button>
        </div>
      </div>
    </Modal>
  );
}
