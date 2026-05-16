'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import DemoRibbon from '@/components/ui/DemoRibbon';
import type { GeneralHistoryRow } from '@/server/actions/general';

const TYPE_ICON: Record<string, string> = { emergency: '🚨', group: '📢', single: '🔊', mp3: '🎵', scheduled: '⏰' };

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${pad(s)}`;
}

export default function GeneralHistoryClient({ entries }: { entries: GeneralHistoryRow[] }) {
  const t = useTranslations('general');
  const tHistory = useTranslations('general.history');

  return (
    <div className="elder-body">
      <DemoRibbon />

      <div className="elder-screen">
        <h1 className="mb-2">{tHistory('title')}</h1>
        <p className="text-base text-slate-500 mb-5">{tHistory('subtitle')}</p>

        {entries.length === 0 ? (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center mt-4">
            <div className="text-5xl mb-3">📭</div>
            <p>{tHistory('empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(e => (
              <div key={e.id} className="bg-white border-2 border-slate-200 rounded-3xl p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0" style={{ fontSize: 40 }}>{TYPE_ICON[e.type] || '📢'}</div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{e.target}</div>
                    <div style={{ fontSize: 17, color: '#64748b', marginTop: 4 }}>
                      {tHistory('lineSub', { time: formatTime(e.occurredAt), duration: formatDuration(e.durationSec) })}
                    </div>
                  </div>
                </div>
                {e.hasRecording && (
                  <button
                    className="mt-4 w-full bg-blue-100 text-blue-700 font-bold rounded-2xl flex items-center justify-center gap-2"
                    style={{ minHeight: 60, fontSize: 19 }}
                  >
                    <span style={{ fontSize: 24 }}>▶</span>
                    {tHistory('playRecording')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="elder-bottombar">
        <Link href="/general"><span className="ic">🏠</span><span>{t('navHome')}</span></Link>
        <Link href="/general/history" className="active"><span className="ic">📜</span><span>{t('navHistory')}</span></Link>
        <Link href="/"><span className="ic">🚪</span><span>{t('navExit')}</span></Link>
      </nav>
    </div>
  );
}
