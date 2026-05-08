'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import DemoRibbon from '@/components/ui/DemoRibbon';
import { EMERGENCIES, SPEAKERS, TEMPLATES, type Emergency, type Speaker, type Template } from '@/lib/mock';

export default function VillageCallPage() {
  const router = useRouter();
  const [data, setData] = useState<{ kind: string; emergencyId?: string | null; templateId?: string | null; speakerIds?: string[] } | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState('กำลังเชื่อมต่อ...');
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('villageCall');
    if (!raw) {
      router.replace('/village');
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.kind) {
        router.replace('/village');
        return;
      }
      setData(parsed);
    } catch {
      router.replace('/village');
      return;
    }

    const startTimer = setTimeout(() => {
      setStatus(JSON.parse(raw).kind === 'emergency' ? '● กำลังประกาศไซเรน' : '● กำลังพูด...');
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }, 1500);

    return () => {
      clearTimeout(startTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [router]);

  function hangup() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setDone(true);
    sessionStorage.removeItem('villageCall');
    setTimeout(() => router.push('/village'), 4000);
  }

  if (!data) return null;

  const speakers: Speaker[] = (data.speakerIds || []).map(id => SPEAKERS.find(s => s.id === id)).filter(Boolean) as Speaker[];
  const emergency: Emergency | null = data.emergencyId ? EMERGENCIES.find(e => e.id === data.emergencyId) || null : null;
  const template: Template | null = data.templateId ? TEMPLATES.find(t => t.id === data.templateId) || null : null;

  let title = '—';
  let sub = '—';
  let micGlyph = '📢';
  let ttsLine: string | null = null;
  let isEmergency = false;

  if (data.kind === 'emergency' && emergency) {
    isEmergency = true;
    title = `🚨 ${emergency.name}`;
    sub = `เตือนภัยทุกจุด · เบอร์ ${emergency.ext}`;
    micGlyph = '🚨';
    if (emergency.tts) ttsLine = `🗣️ "${emergency.tts}"`;
  } else if (data.kind === 'template' && template) {
    title = template.name;
    sub = `เล่นไฟล์เสียง · ${speakers.length} ลำโพง · ${template.duration}`;
    micGlyph = template.icon || '🔈';
  } else if (data.kind === 'group') {
    title = `ประกาศไปยัง ${speakers.length} จุด`;
    sub = speakers.slice(0, 3).map(s => s.name).join(', ') + (speakers.length > 3 ? '...' : '');
  } else {
    title = speakers[0] ? speakers[0].name : 'ลำโพง';
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
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>ประกาศสำเร็จ</div>
            <div style={{ fontSize: 19, opacity: 0.95 }}>
              {speakers.length > 1
                ? `ประกาศไปยัง ${speakers.length} จุด เป็นเวลา ${m}:${s} นาที`
                : `ประกาศเป็นเวลา ${m}:${s} นาที`}
            </div>
          </div>
          <div style={{ padding: '0 20px 28px' }}>
            <Link href="/village" className="btn-elder-hangup" style={{ textDecoration: 'none', color: '#15803d' }}>
              <span style={{ fontSize: 32 }}>🏠</span>
              <span>กลับหน้าหลัก</span>
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
          {ttsLine && (
            <div style={{ marginTop: 24, padding: '14px 18px', background: 'rgba(255,255,255,0.18)', borderRadius: 16, fontSize: 17, maxWidth: 480, lineHeight: 1.5 }}>
              {ttsLine}
            </div>
          )}
        </div>
        <div style={{ padding: '0 20px 28px' }}>
          <button onClick={hangup} className="btn-elder-hangup">
            <span style={{ fontSize: 38 }}>✕</span>
            <span>หยุดประกาศ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
