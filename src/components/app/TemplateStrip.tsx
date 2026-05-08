'use client';

import { useTranslations } from 'next-intl';
import { TEMPLATES, type Template } from '@/lib/mock';

interface Props {
  onPick: (t: Template) => void;
  onOpenTts: () => void;
}

export default function TemplateStrip({ onPick, onOpenTts }: Props) {
  const t = useTranslations('templates');
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-bold text-slate-900">{t('title')}</h2>
          <p className="text-xs text-slate-500">{t('subtitle')}</p>
        </div>
        <button onClick={onOpenTts} className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium">
          {t('ttsButton')}
        </button>
      </div>
      <div className="scroll-strip pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 min-w-max sm:min-w-0">
          {TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => onPick(tpl)}
              className="template-chip bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 text-left w-56 sm:w-auto flex-shrink-0"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">{tpl.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900 truncate">{t(`names.${tpl.id}`)}</div>
                <div className="text-xs text-slate-500">{tpl.duration} · {tpl.file}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <button onClick={onOpenTts} className="sm:hidden mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg font-medium">
        {t('ttsButton')}
      </button>
    </section>
  );
}
