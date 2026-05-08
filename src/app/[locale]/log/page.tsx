'use client';

import { useTranslations } from 'next-intl';
import AppHeader from '@/components/AppHeader';
import DemoRibbon from '@/components/ui/DemoRibbon';
import StatCard from '@/components/ui/StatCard';
import { LOG_ENTRIES, TYPE_LABEL } from '@/lib/mock';

export default function LogPage() {
  const t = useTranslations('logPage');
  const tTypes = useTranslations('logTypes');
  const tCommon = useTranslations('common');
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <DemoRibbon />
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label={t('stats.today')} value="4" />
          <StatCard label={t('stats.week')} value="28" />
          <StatCard label={t('stats.emergencyMonth')} value="2" accent="text-red-600" />
          <StatCard label={t('stats.totalDuration')} value={t('stats.totalDurationValue')} />
        </div>

        <section className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{tCommon('from')}</label>
            <input type="date" defaultValue="2026-05-01" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{tCommon('to')}</label>
            <input type="date" defaultValue="2026-05-07" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t('filters.user')}</label>
            <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option>{t('filters.userOptions.all')}</option>
              <option>{t('filters.userOptions.mayor')}</option>
              <option>{t('filters.userOptions.officerSomchai')}</option>
              <option>{t('filters.userOptions.officerSomying')}</option>
              <option>{t('filters.userOptions.system')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t('filters.type')}</label>
            <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option>{tCommon('all')}</option>
              <option>{tTypes('emergency')}</option>
              <option>{tTypes('group')}</option>
              <option>{tTypes('single')}</option>
              <option>{tTypes('scheduled')}</option>
              <option>{tTypes('mp3')}</option>
            </select>
          </div>
          <div className="flex-1"></div>
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium">{tCommon('exportCsv')}</button>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-600">
                  <th className="px-5 py-3 font-semibold">{t('table.time')}</th>
                  <th className="px-5 py-3 font-semibold">{t('table.user')}</th>
                  <th className="px-5 py-3 font-semibold">{t('table.target')}</th>
                  <th className="px-5 py-3 font-semibold">{t('table.duration')}</th>
                  <th className="px-5 py-3 font-semibold">{t('table.type')}</th>
                  <th className="px-5 py-3 font-semibold">{t('table.recording')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {LOG_ENTRIES.map((e, i) => {
                  const tt = TYPE_LABEL[e.type];
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{e.time}</td>
                      <td className="px-5 py-3">{e.user}</td>
                      <td className="px-5 py-3 text-slate-700">{e.target}</td>
                      <td className="px-5 py-3 font-mono text-slate-600">{e.duration}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${tt.class}`}>{tTypes(e.type)}</span>
                      </td>
                      <td className="px-5 py-3">
                        {e.recording ? (
                          <div className="flex items-center gap-1">
                            <button className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-medium">{t('table.play')}</button>
                            <button className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md">⬇</button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>{t('showing', { shown: LOG_ENTRIES.length, total: 247 })}</span>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-slate-200 rounded text-slate-700 hover:bg-slate-50">{tCommon('previous')}</button>
              <button className="px-3 py-1 border border-slate-200 rounded bg-blue-900 text-white">1</button>
              <button className="px-3 py-1 border border-slate-200 rounded text-slate-700 hover:bg-slate-50">2</button>
              <button className="px-3 py-1 border border-slate-200 rounded text-slate-700 hover:bg-slate-50">3</button>
              <button className="px-3 py-1 border border-slate-200 rounded text-slate-700 hover:bg-slate-50">{tCommon('next')}</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
