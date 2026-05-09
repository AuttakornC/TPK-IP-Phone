'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { TemplatePreset } from '@/lib/presetStore';

interface Props {
  presets: TemplatePreset[];
  onPick: (preset: TemplatePreset) => void;
}

export default function TemplateStrip({ presets, onPick }: Props) {
  const t = useTranslations('templates');
  const tNames = useTranslations('templates.names');

  function presetLabel(p: TemplatePreset): string {
    if (p.custom) return p.name;
    if (tNames.has(p.id)) return tNames(p.id);
    return p.name;
  }

  function presetSubLine(p: TemplatePreset): string {
    const file = p.mp3Name || p.file || t('noMp3');
    return `${p.duration} · ${file}`;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-bold text-slate-900">{t('title')}</h2>
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
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center text-sm text-slate-500">
          {t('emptyPresets')}{' '}
          <Link href="/presets" className="text-blue-700 font-medium">{t('managePresetsInline')}</Link>
        </div>
      ) : (
        <div className="scroll-strip pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 min-w-max sm:min-w-0">
            {presets.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => onPick(tpl)}
                className="template-chip bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 text-left w-56 sm:w-auto flex-shrink-0"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">{tpl.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{presetLabel(tpl)}</div>
                  <div className="text-xs text-slate-500 truncate">{presetSubLine(tpl)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
