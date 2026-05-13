'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import DemoRibbon from '@/components/ui/DemoRibbon';
import { DEMO_USER_BY_ROLE, LOG_ENTRIES, USERS, type LogEntry, type User } from '@/lib/mock';
import { getCurrentUser } from '@/lib/role';

const TYPE_ICON: Record<string, string> = { emergency: '🚨', group: '📢', single: '🔊', mp3: '🎵', scheduled: '⏰' };

export default function GeneralHistoryPage() {
  const t = useTranslations('general');
  const tHistory = useTranslations('general.history');
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    const u = getCurrentUser() || USERS.find(x => x.username === DEMO_USER_BY_ROLE.general) || null;
    setUser(u);
    setEntries(u ? LOG_ENTRIES.filter(e => e.userId === u.username) : []);
  }, []);

  void user;

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
            {entries.map((e, i) => (
              <div key={i} className="bg-white border-2 border-slate-200 rounded-3xl p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0" style={{ fontSize: 40 }}>{TYPE_ICON[e.type] || '📢'}</div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{e.target}</div>
                    <div style={{ fontSize: 17, color: '#64748b', marginTop: 4 }}>{tHistory('lineSub', { time: e.time, duration: e.duration })}</div>
                  </div>
                </div>
                {e.recording && (
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
