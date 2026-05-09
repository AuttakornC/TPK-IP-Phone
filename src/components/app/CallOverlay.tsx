'use client';

import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import type { CallState } from './types';
import { EMERGENCY_GLYPHS } from './types';

function CallHeader({ call, status, seconds, micPct, liveMic }: { call: CallState; status: string; seconds: number; micPct: number; liveMic: boolean }) {
  const t = useTranslations('callOverlay');
  const tEm = useTranslations('emergency.names');
  const tTpl = useTranslations('templates.names');
  let target = '—';
  let subtarget = '—';
  let bg = 'bg-gradient-to-br from-blue-900 to-blue-700';

  if (call.kind === 'single') {
    const s = call.speakers[0];
    target = s.name;
    subtarget = `Ext. ${s.ext} · ${s.area}`;
  } else if (call.kind === 'group') {
    target = t('groupTarget', { count: call.speakers.length });
    subtarget = call.speakers.slice(0, 3).map(s => s.name).join(', ') + (call.speakers.length > 3 ? '...' : '');
  } else if (call.kind === 'emergency' && call.emergency) {
    bg = 'bg-gradient-to-br from-red-700 to-red-900';
    const emName = !call.emergency.custom && tEm.has(call.emergency.id) ? tEm(call.emergency.id) : call.emergency.name;
    const emGlyph = call.emergency.icon || EMERGENCY_GLYPHS[call.emergency.id] || '🚨';
    target = t('emergencyTarget', { glyph: emGlyph, name: emName });
    subtarget = t('emergencySubtarget', { ext: call.emergency.ext, count: call.speakers.length });
  } else if (call.kind === 'mp3' && call.mp3) {
    bg = 'bg-gradient-to-br from-amber-700 to-orange-700';
    target = call.mp3.name;
    subtarget = t('templateSubtarget', { file: call.mp3.name, duration: call.mp3.duration });
  } else if (call.kind === 'template' && call.template) {
    bg = 'bg-gradient-to-br from-indigo-800 to-blue-700';
    const tpl = call.template;
    target = !tpl.custom && tTpl.has(tpl.id) ? tTpl(tpl.id) : tpl.name;
    const file = tpl.mp3Name || tpl.file || '—';
    subtarget = t('templateSubtarget', { file, duration: tpl.duration });
  }

  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');

  return (
    <div className={`p-6 text-white ${bg}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{status}</span>
        <span className="text-sm font-mono opacity-90">{m}:{s}</span>
      </div>
      <div className="text-2xl font-bold">{target}</div>
      <div className="text-sm opacity-80 mt-1">{subtarget}</div>
      <div className="mt-6 flex items-center gap-3">
        <div className="ringing-bars">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        {liveMic ? (
          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="mic-bar h-full bg-green-400 rounded-full" style={{ width: `${micPct}%` }} />
          </div>
        ) : (
          <div className="flex-1 text-xs opacity-70 text-right">{t('mp3Only')}</div>
        )}
      </div>
    </div>
  );
}

interface Props {
  call: CallState | null;
  status: string;
  seconds: number;
  micPct: number;
  muted: boolean;
  onToggleMute: () => void;
  onEnd: () => void;
}

export default function CallOverlay({ call, status, seconds, micPct, muted, onToggleMute, onEnd }: Props) {
  const t = useTranslations('callOverlay');
  if (!call) return null;
  // Live mic is on for: explicit 'mp3-then-mic' presets, single/group calls, and any call without a play mode set.
  const liveMic = call.playMode !== 'mp3';
  return (
    <Modal open size="sm" align="bottom">
      <CallHeader call={call} status={status} seconds={seconds} micPct={micPct} liveMic={liveMic} />
      <div className={`p-5 grid ${liveMic ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
        {liveMic && (
          <button
            onClick={onToggleMute}
            className={`flex flex-col items-center gap-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 ${muted ? 'bg-slate-100' : ''}`}
          >
            <span className="text-xl">🎤</span>
            <span className="text-xs font-medium">{muted ? t('muteOn') : t('muteOff')}</span>
          </button>
        )}
        <button className="flex flex-col items-center gap-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50">
          <span className="text-xl">🔊</span>
          <span className="text-xs font-medium">{t('volume')}</span>
        </button>
        <button onClick={onEnd} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white">
          <span className="text-xl">📵</span>
          <span className="text-xs font-medium">{t('hangup')}</span>
        </button>
      </div>
    </Modal>
  );
}
