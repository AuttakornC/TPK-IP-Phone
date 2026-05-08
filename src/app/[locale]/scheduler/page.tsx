'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import DemoRibbon from '@/components/ui/DemoRibbon';
import { SCHEDULES } from '@/lib/mock';

export default function SchedulerPage() {
  const t = useTranslations('scheduler');
  const tCommon = useTranslations('common');
  const [enabled, setEnabled] = useState<Record<number, boolean>>(
    Object.fromEntries(SCHEDULES.map(s => [s.id, s.enabled]))
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <DemoRibbon />
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
            <p className="text-sm text-slate-500">{t('subtitle')}</p>
          </div>
          <button className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap">
            {t('addSchedule')}
          </button>
        </div>

        <section className="bg-gradient-to-br from-blue-900 to-indigo-800 text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">⏰</div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider opacity-80">{t('next')}</div>
            <div className="font-bold text-lg mt-0.5">{t('nextItem')}</div>
            <div className="text-sm opacity-90 mt-0.5">{t('nextDetail', { file: t('nextFile') })}</div>
          </div>
          <button className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-medium">{t('skip')}</button>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">{t('all')}</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {SCHEDULES.map(s => {
              const isOn = enabled[s.id];
              return (
                <li key={s.id} className="px-5 py-4 flex items-start sm:items-center gap-4 flex-wrap sm:flex-nowrap">
                  <div className={`w-11 h-11 rounded-xl ${isOn ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'} flex items-center justify-center flex-shrink-0`}>⏰</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold ${isOn ? 'text-slate-900' : 'text-slate-500'}`}>{s.name}</span>
                      {s.skipHolidays && (
                        <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-violet-100 text-violet-700 ring-1 ring-violet-200">{t('skipHolidays')}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{t('lineDetail', { when: s.when, target: s.target, file: s.file })}</div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isOn}
                        onChange={() => setEnabled(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                    <button className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title={tCommon('edit')}>✎</button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title={tCommon('delete')}>🗑</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
