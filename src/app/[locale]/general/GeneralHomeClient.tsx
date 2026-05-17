'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useRef, useState, useTransition, type ChangeEvent } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import DemoRibbon from '@/components/ui/DemoRibbon';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import type { GeneralHomeData, GeneralSpeakerRow, Mp3LibraryRow } from '@/server/actions/general';
import { deleteMyMp3, listMyMp3Library, uploadMyMp3 } from '@/server/actions/general';

const MAX_MP3_PER_USER = 5;

const UPLOAD_ERROR_KEY: Record<string, string> = {
  not_authorized: 'notAuthorized',
  no_file: 'noFile',
  invalid_type: 'invalidType',
  too_large: 'tooLarge',
  quota_full: 'quotaFull',
};

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

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function GeneralHomeClient({
  data,
  initialMp3Library,
}: {
  data: GeneralHomeData;
  initialMp3Library: Mp3LibraryRow[];
}) {
  const router = useRouter();
  const t = useTranslations('general');
  const [confirm, setConfirm] = useState<ConfirmDialog | null>(null);
  const [library, setLibrary] = useState<Mp3LibraryRow[]>(initialMp3Library);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  function onFilePicked(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLibraryError(null);
    const form = new FormData();
    form.set('file', file);
    startTransition(async () => {
      const res = await uploadMyMp3(form);
      if (!res.ok) {
        setLibraryError(t(`library.errors.${UPLOAD_ERROR_KEY[res.error] ?? 'noFile'}`));
        return;
      }
      const rows = await listMyMp3Library();
      setLibrary(rows);
    });
  }

  function onDeleteMp3(id: string) {
    setLibraryError(null);
    startTransition(async () => {
      await deleteMyMp3(id);
      const rows = await listMyMp3Library();
      setLibrary(rows);
    });
  }

  function askConfirm(opts: ConfirmDialog) {
    setConfirm(opts);
  }

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

  const quotaFull = library.length >= MAX_MP3_PER_USER;

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

        <section className="bg-white border-2 border-slate-200 rounded-3xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="m-0" style={{ fontSize: 22, fontWeight: 800 }}>
              🎵 {t('library.title')}
            </h2>
            <div style={{ fontSize: 16, color: '#64748b' }}>
              {t('library.count', { used: library.length, max: MAX_MP3_PER_USER })}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,.mp3"
            onChange={onFilePicked}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={pending || quotaFull}
            className={
              pending || quotaFull
                ? 'w-full bg-slate-200 text-slate-400 font-bold rounded-2xl flex items-center justify-center gap-2 mb-3'
                : 'w-full bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 mb-3'
            }
            style={{ minHeight: 60, fontSize: 18 }}
          >
            <span style={{ fontSize: 24 }}>⬆️</span>
            <span>{pending ? t('library.uploading') : t('library.upload')}</span>
          </button>

          {libraryError && (
            <div className="mb-3 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 p-3" style={{ fontSize: 16 }}>
              ⚠️ {libraryError}
            </div>
          )}

          {library.length === 0 ? (
            <div className="text-center text-slate-500 py-2" style={{ fontSize: 16 }}>
              {t('library.empty')}
            </div>
          ) : (
            <div className="space-y-2">
              {library.map(m => (
                <div key={m.id} className="flex items-center gap-3 border-2 border-slate-100 rounded-2xl p-3">
                  <div style={{ fontSize: 28 }}>🎵</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate" style={{ fontSize: 18 }}>{m.name}</div>
                    <div style={{ fontSize: 14, color: '#64748b' }}>
                      {t('library.size', { size: formatBytes(m.sizeBytes) })}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteMp3(m.id)}
                    disabled={pending}
                    className="bg-red-100 text-red-700 font-bold rounded-2xl px-4"
                    style={{ minHeight: 48, fontSize: 16 }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

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
