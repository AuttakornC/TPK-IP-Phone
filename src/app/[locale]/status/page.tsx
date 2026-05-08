'use client';

import { useTranslations } from 'next-intl';
import AppHeader from '@/components/AppHeader';
import DemoRibbon from '@/components/ui/DemoRibbon';
import MeterBar from '@/components/ui/MeterBar';
import StatCard from '@/components/ui/StatCard';
import { SPEAKERS, SYSTEM_STATUS } from '@/lib/mock';

const ISSUE_KEY_BY_INDEX = ['i1', 'i2', 'i3', 'i4', 'i5'] as const;

export default function StatusPage() {
  const t = useTranslations('statusPage');
  const tCommon = useTranslations('common');
  const tIssues = useTranslations('recentIssues');
  const tZones = useTranslations('zones.labels');
  const tUptime = useTranslations('systemUptime');
  const tSpeakers = useTranslations('speakers');

  const services = [
    { key: 'asterisk', name: t('serviceNames.asterisk'), status: SYSTEM_STATUS.asterisk.status, uptime: tUptime('asterisk'), cpu: SYSTEM_STATUS.asterisk.cpu, mem: SYSTEM_STATUS.asterisk.mem },
    { key: 'webApp', name: t('serviceNames.webApp'), status: SYSTEM_STATUS.webApp.status, uptime: tUptime('webApp'), cpu: SYSTEM_STATUS.webApp.cpu, mem: SYSTEM_STATUS.webApp.mem },
    { key: 'database', name: t('serviceNames.database'), status: SYSTEM_STATUS.database.status, uptime: tUptime('asterisk'), cpu: 3, mem: 8 },
    { key: 'nginx', name: t('serviceNames.nginx'), status: 'ok' as const, uptime: t('uptimeNginx'), cpu: 1, mem: 4 },
  ];

  const used = SYSTEM_STATUS.storage.used, total = SYSTEM_STATUS.storage.total;
  const pct = Math.round((used / total) * 100);

  const sslDays = SYSTEM_STATUS.ssl.daysLeft;
  const sslCls = sslDays < 14 ? 'bg-red-100 text-red-700' : sslDays < 30 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';

  const STATUS_BADGE: Record<string, { text: string; cls: string }> = {
    ok: { text: t('badges.ok'), cls: 'bg-green-100 text-green-700 ring-green-200' },
    warn: { text: t('badges.warn'), cls: 'bg-amber-100 text-amber-700 ring-amber-200' },
    err: { text: t('badges.err'), cls: 'bg-red-100 text-red-700 ring-red-200' },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <DemoRibbon />
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
            <p className="text-sm text-slate-500">{t('subtitle')}</p>
          </div>
          <button className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-medium flex items-center gap-2">{tCommon('refresh')}</button>
        </div>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label={t('asteriskCard')} value={t('asteriskValue')} hint={t('uptimeHint', { uptime: tUptime('asterisk') })} accent="text-green-600" />
          <StatCard label={t('speakersOnline')} value={`${SYSTEM_STATUS.speakers.online}/${SYSTEM_STATUS.speakers.total}`} hint={t('lastCheck', { time: tSpeakers('lastCheckHint') })} />
          <StatCard label={t('storage')} value={`${SYSTEM_STATUS.storage.used} ${SYSTEM_STATUS.storage.unit}`} hint={t('storageHint', { total: SYSTEM_STATUS.storage.total, unit: SYSTEM_STATUS.storage.unit })} />
          <StatCard label={t('lastBackup')} value={t('backupSuccess')} hint={SYSTEM_STATUS.backup.last} accent="text-green-600" />
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">{t('servicesTitle')}</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {services.map(s => {
              const v = STATUS_BADGE[s.status] || STATUS_BADGE.ok;
              return (
                <div key={s.key} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[140px]">
                    <div className="font-medium text-slate-900">{s.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t('uptimeHint', { uptime: s.uptime })}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">CPU</span>
                        <span className="font-mono text-slate-700">{s.cpu}%</span>
                      </div>
                      <MeterBar value={s.cpu} className="w-full" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">RAM</span>
                        <span className="font-mono text-slate-700">{s.mem}%</span>
                      </div>
                      <MeterBar value={s.mem} className="w-full" />
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ring-1 ${v.cls}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {v.text}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">{t('speakerHealthTitle', { time: tSpeakers('lastCheckHint') })}</h2>
            <span className="text-xs text-slate-500">{t('speakerHealthCount', { online: SYSTEM_STATUS.speakers.online, total: SYSTEM_STATUS.speakers.total })}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-5">
            {SPEAKERS.map(s => (
              <div key={s.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${s.online ? 'border-slate-200' : 'border-red-200 bg-red-50'}`}>
                <span className={`w-2 h-2 rounded-full ${s.online ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{s.name}</div>
                  <div className="text-xs text-slate-500">{t('speakerExt', { ext: s.ext, zone: tZones(s.zone) })}</div>
                </div>
                <span className={`text-xs font-medium ${s.online ? 'text-green-700' : 'text-red-700'}`}>{s.online ? tCommon('online') : tCommon('offline')}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="font-bold text-slate-900 mb-4">{t('storageBackupTitle')}</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 font-medium">{t('diskSpace')}</span>
                  <span className="font-mono text-slate-600">{t('diskUsage', { used, total, unit: SYSTEM_STATUS.storage.unit, pct })}</span>
                </div>
                <MeterBar value={pct} className="w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500">{t('logRetention')}</div>
                  <div className="font-bold text-slate-900">{t('retentionDays', { days: SYSTEM_STATUS.storage.logRetention })}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500">{t('recordingRetention')}</div>
                  <div className="font-bold text-slate-900">{t('retentionDays', { days: SYSTEM_STATUS.storage.recordingRetention })}</div>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-slate-600">{t('lastBackupRow')}</span><span className="font-medium text-slate-900">{t('lastBackupValue', { time: SYSTEM_STATUS.backup.last, size: SYSTEM_STATUS.backup.size })}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">{t('nextBackup')}</span><span className="font-medium text-slate-900">{SYSTEM_STATUS.backup.next}</span></div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="font-bold text-slate-900 mb-4">{t('recentEvents')}</h2>
            <ul className="space-y-2">
              {SYSTEM_STATUS.recentIssues.map((iss, i) => {
                const sev = {
                  warning: { cls: 'bg-amber-100 text-amber-700', glyph: '⚠' },
                  info: { cls: 'bg-blue-100 text-blue-700', glyph: 'ℹ' },
                  error: { cls: 'bg-red-100 text-red-700', glyph: '✕' },
                }[iss.severity] || { cls: 'bg-slate-100 text-slate-700', glyph: '·' };
                const issueKey = ISSUE_KEY_BY_INDEX[i];
                return (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className={`w-6 h-6 rounded-full ${sev.cls} flex-shrink-0 flex items-center justify-center text-xs font-bold`}>{sev.glyph}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-900">{issueKey ? tIssues(issueKey) : iss.message}</div>
                      <div className="text-xs text-slate-500 font-mono">{iss.time}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="text-xs text-slate-500">{t('sslTitle')}</div>
            <div className="font-bold text-slate-900 mt-1">{SYSTEM_STATUS.ssl.issuer}</div>
            <div className="text-xs text-slate-500 mt-1">{t('sslExpires', { date: SYSTEM_STATUS.ssl.validUntil })}</div>
            <div className="mt-3"><span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${sslCls}`}>{t('sslDaysLeft', { days: sslDays })}</span></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="text-xs text-slate-500">{t('networkTitle')}</div>
            <div className="font-bold text-slate-900 mt-1">{SYSTEM_STATUS.network.latency} ms</div>
            <div className="text-xs text-slate-500 mt-1">{t('packetLoss', { pct: SYSTEM_STATUS.network.lossPercent })}</div>
            <div className="mt-3"><span className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium bg-green-100 text-green-700">{t('wssOnline')}</span></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="text-xs text-slate-500">{t('asteriskVersionTitle')}</div>
            <div className="font-bold text-slate-900 mt-1">{SYSTEM_STATUS.asterisk.version}</div>
            <div className="text-xs text-slate-500 mt-1">{t('webAppVersion', { version: SYSTEM_STATUS.webApp.version })}</div>
            <div className="mt-3"><span className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium bg-blue-100 text-blue-700">{t('latest')}</span></div>
          </div>
        </section>
      </main>
    </div>
  );
}
