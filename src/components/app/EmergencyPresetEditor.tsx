'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import PlayModeSelector from './PlayModeSelector';
import type { EmergencyPreset, PlayMode } from '@/lib/presetStore';
import type { Mp3File } from '@/lib/mock';

interface Props {
  open: boolean;
  initial: EmergencyPreset | null;
  mp3Library: Mp3File[];
  onCancel: () => void;
  onSave: (preset: EmergencyPreset) => void;
}

const PALETTES = ['red', 'blue', 'orange', 'amber'] as const;

export default function EmergencyPresetEditor({ open, initial, mp3Library, onCancel, onSave }: Props) {
  const t = useTranslations('presetsPage.emergencyEditor');
  const tCommon = useTranslations('common');

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🚨');
  const [ext, setExt] = useState('000');
  const [palette, setPalette] = useState<string>('red');
  const [mp3Name, setMp3Name] = useState<string>('');
  const [playMode, setPlayMode] = useState<PlayMode>('mp3-then-mic');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setIcon(initial?.icon ?? '🚨');
    setExt(initial?.ext ?? '000');
    setPalette(initial?.palette ?? 'red');
    setMp3Name(initial?.mp3Name ?? '');
    setPlayMode(initial?.playMode ?? 'mp3-then-mic');
  }, [open, initial]);

  if (!open) return null;

  function commit() {
    if (!name.trim()) return;
    onSave({
      id: initial?.id ?? '',
      name: name.trim(),
      icon: icon.trim() || '🚨',
      ext: ext.trim() || '000',
      palette,
      mp3Name: mp3Name || undefined,
      tone: initial?.tone,
      playMode,
      custom: initial?.custom ?? true,
    });
  }

  return (
    <Modal open onClose={onCancel} variant="admin" size="lg">
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {initial ? t('editTitle') : t('addTitle')}
          </h3>
          <p className="text-sm text-slate-500">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr_120px] gap-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 block mb-1">{t('icon')}</span>
            <input
              value={icon}
              onChange={e => setIcon(e.target.value)}
              maxLength={4}
              className="w-full text-center text-2xl px-2 py-2 border border-slate-300 rounded-lg"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 block mb-1">{t('name')}</span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 block mb-1">{t('ext')}</span>
            <input
              value={ext}
              onChange={e => setExt(e.target.value)}
              placeholder="000"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
            />
          </label>
        </div>

        <div>
          <span className="text-sm font-medium text-slate-700 block mb-1">{t('palette')}</span>
          <div className="flex gap-2">
            {PALETTES.map(p => {
              const active = palette === p;
              const bg = { red: 'bg-red-500', blue: 'bg-blue-500', orange: 'bg-orange-500', amber: 'bg-amber-500' }[p];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPalette(p)}
                  className={`w-9 h-9 rounded-full ${bg} ${active ? 'ring-2 ring-offset-2 ring-slate-700' : ''}`}
                  aria-label={p}
                />
              );
            })}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 block mb-1">{t('mp3')}</span>
          <select
            value={mp3Name}
            onChange={e => setMp3Name(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">{t('mp3None')}</option>
            {mp3Library.map(f => (
              <option key={f.name} value={f.name}>{f.name} · {f.duration}</option>
            ))}
          </select>
          <span className="text-xs text-slate-500 mt-1 block">{t('mp3Hint')}</span>
        </label>

        <PlayModeSelector value={playMode} onChange={setPlayMode} accent="red" />

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-medium hover:bg-slate-50">{tCommon('cancel')}</button>
          <button
            onClick={commit}
            disabled={!name.trim()}
            className="flex-1 px-4 py-3 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold"
          >
            {tCommon('save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
