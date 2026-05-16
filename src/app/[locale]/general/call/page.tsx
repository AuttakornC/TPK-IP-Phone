'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import DemoRibbon from '@/components/ui/DemoRibbon';
import { SipClient, SipError, type SipCallHandle } from '@/lib/sip';
import { getSipConfig } from '@/server/actions/sip';
import { claimSpeakerForCall, markMySpeakerIdle } from '@/server/actions/general';

interface CallPayload {
  kind: 'single' | 'group';
  speakers: Array<{ id: string; name: string; area: string; ext: string }>;
}

export default function GeneralCallPage() {
  const router = useRouter();
  const t = useTranslations('general.call');
  const [data, setData] = useState<CallPayload | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState(t('connecting'));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clientRef = useRef<SipClient | null>(null);
  const callsRef = useRef<SipCallHandle[]>([]);
  const startedRef = useRef(false);
  const busySpeakerIdRef = useRef<string | null>(null);

  function teardown() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    clientRef.current?.disconnect();
    clientRef.current = null;
    callsRef.current = [];
    if (busySpeakerIdRef.current) {
      const id = busySpeakerIdRef.current;
      busySpeakerIdRef.current = null;
      void markMySpeakerIdle(id);
    }
  }

  function finish() {
    teardown();
    setDone(true);
    sessionStorage.removeItem('generalCall');
    setTimeout(() => router.push('/general'), 4000);
  }

  function fail(err: unknown) {
    let key: string;
    if (err instanceof SipError) {
      switch (err.code) {
        case 'mic_denied': key = 'errors.micDenied'; break;
        case 'mic_unavailable': key = 'errors.micUnavailable'; break;
        case 'registration': key = 'errors.registration'; break;
        case 'transport': key = 'errors.transport'; break;
        case 'not_connected':
        case 'invalid_config':
        case 'unknown':
        default: key = 'errors.unknown'; break;
      }
    } else {
      key = 'errors.unknown';
    }
    setErrorMsg(t(key));
    teardown();
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const raw = sessionStorage.getItem('generalCall');
    if (!raw) {
      router.replace('/general');
      return;
    }
    let parsed: CallPayload;
    try {
      parsed = JSON.parse(raw) as CallPayload;
    } catch {
      router.replace('/general');
      return;
    }
    if (!parsed.kind || parsed.speakers.length === 0) {
      router.replace('/general');
      return;
    }
    setData(parsed);

    (async () => {
      const configResult = await getSipConfig();
      if (!configResult.ok) {
        setErrorMsg(t(`errors.${configResult.error === 'asterisk_inactive' ? 'asteriskInactive' : 'noCredentials'}`));
        return;
      }

      const target = parsed.speakers[0];
      const claim = await claimSpeakerForCall(target.id);
      if (!claim.ok) {
        setErrorMsg(t(`errors.${claim.error === 'busy' ? 'speakerBusy' : 'unknown'}`));
        return;
      }
      busySpeakerIdRef.current = target.id;

      const client = new SipClient(configResult.config, {
        onCallStateChange: handle => {
          callsRef.current = clientRef.current?.activeCalls() ?? [];
          // Once any call is answered, mark the broadcast as live and start the timer.
          if (handle.state === 'answered' && !timerRef.current) {
            setStatus(t('speaking'));
            timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
          }
          if ((handle.state === 'ended' || handle.state === 'failed') && busySpeakerIdRef.current) {
            const id = busySpeakerIdRef.current;
            busySpeakerIdRef.current = null;
            void markMySpeakerIdle(id);
          }
        },
        onError: err => fail(err),
      });
      clientRef.current = client;

      try {
        await client.connect();
        await client.call({ id: target.id, ext: target.ext, name: target.name });
      } catch (err) {
        fail(err);
      }
    })();

    return () => {
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function hangup() {
    finish();
  }

  if (!data) return null;

  if (errorMsg) {
    return (
      <div className="elder-body">
        <DemoRibbon />
        <div className="elder-fullscreen" style={{ background: 'linear-gradient(160deg, #7f1d1d, #b91c1c, #dc2626)' }}>
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div style={{ fontSize: 110, marginBottom: 18 }}>⚠️</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>{t('errors.title')}</div>
            <div style={{ fontSize: 18, opacity: 0.95, lineHeight: 1.45 }}>{errorMsg}</div>
          </div>
          <div style={{ padding: '0 20px 28px' }}>
            <Link href="/general" className="btn-elder-hangup" style={{ textDecoration: 'none', color: '#b91c1c' }}>
              <span style={{ fontSize: 32 }}>🏠</span>
              <span>{t('backHome')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const speakers = data.speakers;
  let title: string;
  let sub: string;
  const micGlyph = '📢';

  if (data.kind === 'group') {
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
      <div className="elder-fullscreen">
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
