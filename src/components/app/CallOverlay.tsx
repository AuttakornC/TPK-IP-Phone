'use client';

import Modal from '@/components/ui/Modal';
import type { CallState } from './types';
import { EMERGENCY_GLYPHS } from './types';

function CallHeader({ call, status, seconds, micPct }: { call: CallState; status: string; seconds: number; micPct: number }) {
  let target = '—';
  let subtarget = '—';
  let ttsLine: string | null = null;
  let bg = 'bg-gradient-to-br from-blue-900 to-blue-700';

  if (call.kind === 'single') {
    const s = call.speakers[0];
    target = s.name;
    subtarget = `Ext. ${s.ext} · ${s.area}`;
  } else if (call.kind === 'group') {
    target = `ประกาศพร้อมกัน ${call.speakers.length} จุด`;
    subtarget = call.speakers.slice(0, 3).map(s => s.name).join(', ') + (call.speakers.length > 3 ? '...' : '');
  } else if (call.kind === 'emergency' && call.emergency) {
    bg = 'bg-gradient-to-br from-red-700 to-red-900';
    target = `${EMERGENCY_GLYPHS[call.emergency.id] || '🚨'} ${call.emergency.name}`;
    subtarget = `Ext. ${call.emergency.ext} · ทุกจุด ${call.speakers.length} ลำโพง`;
    if (call.emergency.tts) ttsLine = `กำลังอ่านสคริปต์: "${call.emergency.tts}"`;
  } else if (call.kind === 'template' && call.template) {
    bg = 'bg-gradient-to-br from-indigo-800 to-blue-700';
    target = call.template.name;
    subtarget = `เล่น "${call.template.file}" · ทุกจุดออนไลน์ · ${call.template.duration}`;
  } else if (call.kind === 'tts') {
    bg = 'bg-gradient-to-br from-indigo-800 to-purple-700';
    target = '🗣️ ประกาศข้อความ TTS';
    subtarget = `ทุกจุดออนไลน์ · ${call.speakers.length} ลำโพง`;
    if (call.tts) ttsLine = `"${call.tts}"`;
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
      {ttsLine && (
        <div className="mt-3 text-xs bg-white/15 rounded-lg px-3 py-2 italic">{ttsLine}</div>
      )}
      <div className="mt-6 flex items-center gap-3">
        <div className="ringing-bars">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="mic-bar h-full bg-green-400 rounded-full" style={{ width: `${micPct}%` }} />
        </div>
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
  if (!call) return null;
  return (
    <Modal open size="sm" align="bottom">
      <CallHeader call={call} status={status} seconds={seconds} micPct={micPct} />
      <div className="p-5 grid grid-cols-3 gap-3">
        <button
          onClick={onToggleMute}
          className={`flex flex-col items-center gap-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 ${muted ? 'bg-slate-100' : ''}`}
        >
          <span className="text-xl">🎤</span>
          <span className="text-xs font-medium">{muted ? 'เปิดไมค์' : 'ปิดไมค์'}</span>
        </button>
        <button className="flex flex-col items-center gap-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50">
          <span className="text-xl">🔊</span>
          <span className="text-xs font-medium">ระดับเสียง</span>
        </button>
        <button onClick={onEnd} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white">
          <span className="text-xl">📵</span>
          <span className="text-xs font-medium">วางสาย</span>
        </button>
      </div>
    </Modal>
  );
}
