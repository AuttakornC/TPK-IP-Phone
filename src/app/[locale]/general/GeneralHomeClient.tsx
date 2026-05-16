'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import DemoRibbon from '@/components/ui/DemoRibbon';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import type { GeneralHomeData, GeneralSpeakerRow } from '@/server/actions/general';

interface PendingTarget {
  kind: 'single' | 'group';
  speakers: GeneralSpeakerRow[];
}

interface ConfirmDialog {
  title: string;
  detail: string;
  icon: string;
  target: PendingTarget | null;
}

export default function GeneralHomeClient({ data }: { data: GeneralHomeData }) {
  const router = useRouter();
  const t = useTranslations('general');
  const [confirm, setConfirm] = useState<ConfirmDialog | null>(null);

  const mySpeakers = data.speakers;

  const dateStr = useMemo(() => {
    const months = t.raw('months') as string[];
    const weekdays = t.raw('weekdays') as string[];
    const now = new Date();
    return t('dateFormat', {
      weekday: weekdays[now.getDay()],
      day: now.getDate(),
      month: months[now.getMonth()],
      year: now.getFullYear() + 543,
    });
  }, [t]);

  function askConfirm(opts: ConfirmDialog) { setConfirm(opts); }

  function handleConfirmYes() {
    if (!confirm || !confirm.target) {
      setConfirm(null);
      return;
    }
    const target = confirm.target;
    sessionStorage.setItem('generalCall', JSON.stringify({
      kind: target.kind,
      speakers: target.speakers.map(s => ({ id: s.id, name: s.name, area: s.area, ext: s.ext })),
    }));
    router.push('/general/call');
  }

  return (
    <div className="elder-body">
      <DemoRibbon />

      <div className="elder-screen">
        <div className="flex justify-end mb-3"><LanguageSwitcher /></div>
        <section className="bg-white border-2 border-slate-200 rounded-3xl p-5 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-3xl flex-shrink-0">👴</div>
            <div className="flex-1 min-w-0">
              <div className="text-base text-slate-500">{t('greeting')}</div>
              <div className="text-2xl font-bold text-slate-900 truncate">{data.user.name || t('fallbackName')}</div>
              <div className="text-base text-slate-600 truncate">{data.project ? data.project.name : '—'}</div>
            </div>
          </div>
          <div className="mt-3 text-base text-slate-500">📅 {dateStr}</div>
        </section>

        <button
          onClick={() => {}}
          className="btn-elder-primary mb-6"
        >
          <span style={{ fontSize: 34 }}>📢</span>
          <span>{t('broadcastAll')}</span>
        </button>

        <h2 className="mb-3">{t('mySpeakers')}</h2>
        <div className="space-y-3 mb-7">
          {mySpeakers.length === 0 && (
            <div className="elder-card">{t('noSpeakers')}</div>
          )}
          {mySpeakers.map(s => (
            <div key={s.id} className={`elder-card ${s.online ? 'online' : 'offline'}`}>
              <div className="flex-shrink-0" style={{ fontSize: 40 }}>{s.online ? '🟢' : '⚪'}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 truncate" style={{ fontSize: 20 }}>{s.name}</div>
                <div style={{ fontSize: 16, color: s.online ? '#15803d' : '#94a3b8' }}>
                  {s.online ? t('speakerOnline') : t('speakerOffline')}
                </div>
              </div>
              <button
                disabled={!s.online}
                onClick={() => askConfirm({
                  title: t('confirm.singleTitle', { name: s.name }),
                  detail: t('confirm.singleDetail'),
                  icon: '📢',
                  target: { kind: 'single', speakers: [s] },
                })}
                className={s.online ? 'bg-blue-600 text-white font-bold rounded-2xl px-5' : 'bg-slate-200 text-slate-400 font-bold rounded-2xl px-5'}
                style={{ minHeight: 60, fontSize: 18 }}
              >
                {t('speakerBroadcast')}
              </button>
            </div>
          ))}
        </div>
      </div>

      <nav className="elder-bottombar">
        <Link href="/general" className="active"><span className="ic">🏠</span><span>{t('navHome')}</span></Link>
        <Link href="/general/history"><span className="ic">📜</span><span>{t('navHistory')}</span></Link>
        <Link href="/"><span className="ic">🚪</span><span>{t('navExit')}</span></Link>
      </nav>

      {confirm && (
        <div className="elder-confirm">
          <div className="elder-confirm-card">
            <div className="text-5xl mb-3">{confirm.icon}</div>
            <h2>{confirm.title}</h2>
            <p className="mb-5">{confirm.detail}</p>
            <div className="space-y-3">
              <button onClick={handleConfirmYes} className="btn-elder-primary">
                <span style={{ fontSize: 30 }}>✓</span>
                <span>{t('confirm.yes')}</span>
              </button>
              <button onClick={() => setConfirm(null)} className="btn-elder-secondary">
                <span style={{ fontSize: 24 }}>✕</span>
                <span>{t('confirm.no')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
