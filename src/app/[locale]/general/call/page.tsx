'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import DemoRibbon from '@/components/ui/DemoRibbon';
import { EMERGENCIES, SPEAKERS, TEMPLATES, type Emergency, type Speaker, type Template } from '@/lib/mock';

export default function GeneralCallPage() {
  const router = useRouter();
  const t = useTranslations('general.call');
  const tEm = useTranslations('emergency.names');
  const tTpl = useTranslations('templates.names');
  const [data, setData] = useState<{ kind: string; emergencyId?: string | null; templateId?: string | null; speakerIds?: string[] } | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState(t('connecting'));
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('generalCall');
    if (!raw) {
      router.replace('/general');
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.kind) {
        router.replace('/general');
        return;
      }
      setData(parsed);
    } catch {
      router.replace('/general');
      return;
    }

    const startTimer = setTimeout(() => {
      const kind = JSON.parse(raw).kind;
      setStatus(kind === 'emergency' ? t('speakingSiren') : t('speaking'));
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }, 1500);

    return () => {
      clearTimeout(startTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [router, t]);

  function hangup() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setDone(true);
    sessionStorage.removeItem('generalCall');
    setTimeout(() => router.push('/general'), 4000);
  }

  if (!data) return null;

  const speakers: Speaker[] = (data.speakerIds || []).map(id => SPEAKERS.find(s => s.id === id)).filter(Boolean) as Speaker[];
  const emergency: Emergency | null = data.emergencyId ? EMERGENCIES.find(e => e.id === data.emergencyId) || null : null;
  const template: Template | null = data.templateId ? TEMPLATES.find(tpl => tpl.id === data.templateId) || null : null;

  let title = '—';
  let sub = '—';
  let micGlyph = '📢';
  let isEmergency = false;

  if (data.kind === 'emergency' && emergency) {
    isEmergency = true;
    title = t('emergencyTitle', { name: tEm(emergency.id) });
    sub = t('emergencySub', { ext: emergency.ext });
    micGlyph = '🚨';
  } else if (data.kind === 'template' && template) {
    title = tTpl(template.id);
    sub = t('templateSub', { count: speakers.length, duration: template.duration });
    micGlyph = template.icon || '🔈';
  } else if (data.kind === 'group') {
    title = t('groupTitle', { count: speakers.length });
    sub = speakers.slice(0, 3).map(s => s.name).join(', ') + (speakers.length > 3 ? '...' : '');
  } else {
    title = speakers[0] ? speakers[0].name : t('fallbackTarget');
    sub = speakers[0] ? speakers[0].area : '—';
  }

  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');

  if (done) {
    return (
      <div className="elder-body">
        <DemoRibbon />
        <div className="elder-fullscreen" style={{ background: 'linear-gradient(160deg, #166534, #15803d, #16a34a)' }}>
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div style={{ fontSize: 110, marginBottom: 18 }}>✅</div>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>{t('successTitle')}</div>
            <div style={{ fontSize: 19, opacity: 0.95 }}>
              {speakers.length > 1
                ? t('successMulti', { count: speakers.length, min: m, sec: s })
                : t('successSingle', { min: m, sec: s })}
            </div>
          </div>
          <div style={{ padding: '0 20px 28px' }}>
            <Link href="/general" className="btn-elder-hangup" style={{ textDecoration: 'none', color: '#15803d' }}>
              <span style={{ fontSize: 32 }}>🏠</span>
              <span>{t('backHome')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="elder-body">
      <DemoRibbon />
      <div className={`elder-fullscreen ${isEmergency ? 'emergency' : ''}`}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" style={{ paddingBottom: 24 }}>
          <div style={{ fontSize: 22, opacity: 0.85, marginBottom: 18 }}>{status}</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.3, marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 18, opacity: 0.85, marginBottom: 36 }}>{sub}</div>
          <div className="elder-mic">{micGlyph}</div>
          <div style={{ fontSize: 56, fontWeight: 800, fontFamily: 'monospace', marginTop: 32, letterSpacing: '0.04em' }}>
            {m}:{s}
          </div>
        </div>
        <div style={{ padding: '0 20px 28px' }}>
          <button onClick={hangup} className="btn-elder-hangup">
            <span style={{ fontSize: 38 }}>✕</span>
            <span>{t('stop')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
