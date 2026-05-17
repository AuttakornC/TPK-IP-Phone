'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import DemoRibbon from '@/components/ui/DemoRibbon';
import { SipClient, SipError, type SipCallHandle } from '@/lib/sip';
import { OutgoingMixer, DEFAULT_MP3_GAIN, type MixerMp3State } from '@/lib/audio/outgoingMixer';
import { getSipConfig } from '@/server/actions/sip';
import { claimSpeakerForCall, listMyMp3Library, markMySpeakerIdle, type Mp3LibraryRow } from '@/server/actions/general';

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
  const [callAnswered, setCallAnswered] = useState(false);
  const [library, setLibrary] = useState<Mp3LibraryRow[]>([]);
  const [selectedMp3Id, setSelectedMp3Id] = useState<string | null>(null);
  const [mp3State, setMp3State] = useState<MixerMp3State>('idle');
  const [mp3Volume, setMp3Volume] = useState<number>(DEFAULT_MP3_GAIN);
  const [micMuted, setMicMuted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clientRef = useRef<SipClient | null>(null);
  const callsRef = useRef<SipCallHandle[]>([]);
  const startedRef = useRef(false);
  const busySpeakerIdRef = useRef<string | null>(null);
  const mixerRef = useRef<OutgoingMixer | null>(null);

  function teardown() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    clientRef.current?.disconnect();
    clientRef.current = null;
    callsRef.current = [];
    mixerRef.current?.dispose();
    mixerRef.current = null;
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

    void listMyMp3Library().then(setLibrary).catch(() => {});

    (async () => {
      const configResult = await getSipConfig();
      if (!configResult.ok) {
        setErrorMsg(t(`errors.${configResult.error === 'sip_server_inactive' ? 'sipServerInactive' : 'noCredentials'}`));
        return;
      }

      const target = parsed.speakers[0];
      const claim = await claimSpeakerForCall(target.id);
      if (!claim.ok) {
        setErrorMsg(t(`errors.${claim.error === 'busy' ? 'speakerBusy' : 'unknown'}`));
        return;
      }
      busySpeakerIdRef.current = target.id;

      const mixer = new OutgoingMixer({
        onMp3StateChange: setMp3State,
      });
      mixerRef.current = mixer;

      const client = new SipClient(configResult.config, {
        onCallStateChange: handle => {
          callsRef.current = clientRef.current?.activeCalls() ?? [];
          if (handle.state === 'answered' && !callAnswered) {
            setCallAnswered(true);
            if (!timerRef.current) {
              timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
            }
            setStatus(t('speaking'));
            mixerRef.current?.attachMic().catch(err => {
              const name = (err as DOMException)?.name;
              const code = name === 'NotAllowedError'
                ? 'mic_denied'
                : name === 'NotFoundError'
                  ? 'mic_unavailable'
                  : 'unknown';
              fail(new SipError(code, 'mic capture failed', err));
            });
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
        await client.call(
          { id: target.id, ext: target.ext, name: target.name },
          { stream: mixer.stream },
        );
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

  function selectMp3(row: Mp3LibraryRow) {
    if (!mixerRef.current) return;
    mixerRef.current.loadMp3(`/api/mp3/${row.id}`, DEFAULT_MP3_GAIN);
    setSelectedMp3Id(row.id);
    setMp3Volume(DEFAULT_MP3_GAIN);
    setMp3State('idle');
  }

  function togglePlayPause() {
    if (!mixerRef.current || !selectedMp3Id) return;
    if (mp3State === 'playing') {
      mixerRef.current.pauseMp3();
    } else {
      void mixerRef.current.playMp3();
    }
  }

  function resetMp3() {
    mixerRef.current?.resetMp3();
  }

  function changeVolume(value: number) {
    setMp3Volume(value);
    mixerRef.current?.setMp3Gain(value);
  }

  function toggleMicMute() {
    const next = !micMuted;
    setMicMuted(next);
    mixerRef.current?.setMicMuted(next);
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
  const micGlyph = micMuted ? '🔇' : '📢';

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

  const isPlaying = mp3State === 'playing';
  const canControl = callAnswered && selectedMp3Id !== null;
  const volumePct = Math.round(mp3Volume * 100);

  return (
    <div className="elder-body">
      <DemoRibbon />
      <div className="elder-fullscreen" style={{ overflowY: 'auto' }}>
        <div className="flex flex-col items-center px-6 text-center" style={{ paddingTop: 32, paddingBottom: 16 }}>
          <div style={{ fontSize: 22, opacity: 0.85, marginBottom: 14 }}>{status}</div>
          <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.3, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 16, opacity: 0.85, marginBottom: 20 }}>{sub}</div>
          <div className="elder-mic">{micGlyph}</div>
          <div style={{ fontSize: 44, fontWeight: 800, fontFamily: 'monospace', marginTop: 18, letterSpacing: '0.04em' }}>
            {m}:{s}
          </div>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          <button
            onClick={toggleMicMute}
            disabled={!callAnswered}
            className={
              !callAnswered
                ? 'w-full bg-slate-200 text-slate-400 font-bold rounded-2xl flex items-center justify-center gap-2'
                : micMuted
                  ? 'w-full bg-red-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2'
                  : 'w-full bg-white text-slate-900 border-2 border-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2'
            }
            style={{ minHeight: 64, fontSize: 20 }}
          >
            <span style={{ fontSize: 30 }}>{micMuted ? '🔇' : '🎤'}</span>
            <span>{t(micMuted ? 'micUnmute' : 'micMute')}</span>
          </button>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          <section className="bg-white text-slate-900 rounded-3xl border-2 border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="m-0" style={{ fontSize: 18, fontWeight: 800 }}>🎵 {t('player.title')}</h3>
              <div style={{ fontSize: 14, color: '#64748b' }}>{t('player.count', { count: library.length })}</div>
            </div>

            {library.length === 0 ? (
              <div className="text-center text-slate-500 py-3" style={{ fontSize: 15 }}>
                {t('player.empty')}
              </div>
            ) : (
              <div className="mb-3">
                <label htmlFor="mp3-picker" className="block font-semibold text-slate-700 mb-1" style={{ fontSize: 14 }}>
                  {t('player.choose')}
                </label>
                <select
                  id="mp3-picker"
                  value={selectedMp3Id ?? ''}
                  onChange={e => {
                    const id = e.target.value;
                    if (!id) return;
                    const row = library.find(m => m.id === id);
                    if (row) selectMp3(row);
                  }}
                  disabled={!callAnswered}
                  className={`w-full rounded-2xl border-2 px-3 font-semibold appearance-none ${
                    callAnswered ? 'border-slate-300 bg-white text-slate-900' : 'border-slate-100 bg-slate-50 text-slate-400'
                  }`}
                  style={{
                    minHeight: 56,
                    fontSize: 17,
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3e%3cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '24px 24px',
                    paddingRight: 44,
                  }}
                >
                  <option value="" disabled>{t('player.choosePlaceholder')}</option>
                  {library.map(m => (
                    <option key={m.id} value={m.id}>🎵 {m.name}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedMp3Id && (
              <div className="space-y-3 pt-2 border-t-2 border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={togglePlayPause}
                    disabled={!canControl}
                    className={
                      canControl
                        ? (isPlaying
                            ? 'bg-amber-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2'
                            : 'bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2')
                        : 'bg-slate-200 text-slate-400 font-bold rounded-2xl flex items-center justify-center gap-2'
                    }
                    style={{ minHeight: 64, fontSize: 18 }}
                  >
                    <span style={{ fontSize: 26 }}>{isPlaying ? '⏸' : '▶️'}</span>
                    <span>{t(isPlaying ? 'player.pause' : 'player.play')}</span>
                  </button>
                  <button
                    onClick={resetMp3}
                    disabled={!canControl}
                    className={
                      canControl
                        ? 'bg-slate-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2'
                        : 'bg-slate-200 text-slate-400 font-bold rounded-2xl flex items-center justify-center gap-2'
                    }
                    style={{ minHeight: 64, fontSize: 18 }}
                  >
                    <span style={{ fontSize: 26 }}>🔄</span>
                    <span>{t('player.reset')}</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 14, color: '#64748b' }}>{t('player.volume')}</span>
                    <span className="font-mono" style={{ fontSize: 14, color: '#475569' }}>{volumePct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={mp3Volume}
                    onChange={e => changeVolume(Number(e.target.value))}
                    disabled={!canControl}
                    className="w-full"
                    style={{ height: 32 }}
                  />
                </div>
              </div>
            )}
          </section>
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
