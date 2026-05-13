'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';
import Modal from './Modal';

type Tone = 'danger' | 'warning' | 'primary';

const TONE_ICON_CLASS: Record<Tone, string> = {
  danger: 'bg-red-100 text-red-600',
  warning: 'bg-amber-100 text-amber-700',
  primary: 'bg-blue-100 text-blue-700',
};

const TONE_CONFIRM_CLASS: Record<Tone, string> = {
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  primary: 'bg-blue-700 hover:bg-blue-800 text-white',
};

interface Props {
  open: boolean;
  tone?: Tone;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  body?: ReactNode;
  warning?: ReactNode;
  error?: string | null;
  cancelLabel?: string;
  confirmLabel: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  tone = 'danger',
  icon,
  title,
  subtitle,
  body,
  warning,
  error,
  cancelLabel,
  confirmLabel,
  pending = false,
  onCancel,
  onConfirm,
}: Props) {
  const tCommon = useTranslations('common');
  const handleClose = () => {
    if (!pending) onCancel();
  };

  return (
    <Modal open={open} onClose={handleClose} variant="admin" size="sm">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          {icon !== undefined && (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 ${TONE_ICON_CLASS[tone]}`}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500 truncate">{subtitle}</p>}
          </div>
        </div>

        {body && <div className="text-sm text-slate-700">{body}</div>}

        {warning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            {warning}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelLabel ?? tCommon('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`flex-1 px-4 py-3 rounded-xl font-bold disabled:opacity-60 ${TONE_CONFIRM_CLASS[tone]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
