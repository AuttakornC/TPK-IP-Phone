'use client';

import { useTranslations } from 'next-intl';
import type { Emergency } from '@/lib/mock';
import Modal from '@/components/ui/Modal';
import { EMERGENCY_GLYPHS } from './types';

interface Props {
  emergency: Emergency | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function EmergencyConfirmDialog({ emergency, onCancel, onConfirm }: Props) {
  const t = useTranslations('emergency');
  const tCommon = useTranslations('common');
  if (!emergency) return null;
  const name = t(`names.${emergency.id}`);
  const tts = t(`tts.${emergency.id}`);
  return (
    <Modal open onClose={onCancel} variant="admin" size="sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl">
            {EMERGENCY_GLYPHS[emergency.id] || '🚨'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('confirmTitle', { name })}</h3>
            <p className="text-sm text-slate-500">{t('confirmSub', { ext: emergency.ext })}</p>
          </div>
        </div>
        {tts && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 mb-3 italic">
            🗣️ &quot;{tts}&quot;
          </div>
        )}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 mb-5">
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
