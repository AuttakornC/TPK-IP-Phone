'use client';

import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import type { CallState } from './types';

interface Props {
  pending: CallState | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const KIND_GLYPH: Record<string, string> = {
  single: '📞',
  group: '👥',
  template: '🗒️',
  mp3: '🎵',
};

export default function BroadcastConfirmDialog({ pending, onCancel, onConfirm }: Props) {
  const t = useTranslations('broadcastConfirm');
  const tTemplates = useTranslations('templates.names');
  const tCommon = useTranslations('common');
  if (!pending || pending.kind === 'emergency') return null;

  const kind = pending.kind;
  const speakers = pending.speakers;
  const onlineCount = speakers.filter(s => s.online).length;
  const targetSummary = speakers.length === 1
    ? speakers[0].name
    : t('targetSummary', { count: speakers.length, online: onlineCount });

  let detail: string | null = null;
  if (kind === 'template' && pending.template) {
    const tpl = pending.template;
    const label = !tpl.custom && tTemplates.has(tpl.id) ? tTemplates(tpl.id) : tpl.name;
    detail = t('detailTemplate', { name: label });
  } else if (kind === 'mp3' && pending.mp3) {
    detail = t('detailMp3', { name: pending.mp3.name });
  } else if (kind === 'single' && speakers[0]) {
    detail = t('detailSingle', { ext: speakers[0].ext });
  } else if (kind === 'group') {
    detail = t('detailGroup');
  }

  return (
    <Modal open onClose={onCancel} variant="admin" size="sm">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl">
            {KIND_GLYPH[kind] || '📡'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t(`kindTitle.${kind}`)}</h3>
            <p className="text-sm text-slate-500">{targetSummary}</p>
          </div>
        </div>

        {detail && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700">
            {detail}
          </div>
        )}

        {speakers.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            {t('noSpeakers')}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          {t('logged')}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-medium hover:bg-slate-50">{tCommon('cancel')}</button>
          <button
            onClick={onConfirm}
            disabled={speakers.length === 0}
            className="flex-1 px-4 py-3 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold"
          >
            {t('confirmBtn')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
