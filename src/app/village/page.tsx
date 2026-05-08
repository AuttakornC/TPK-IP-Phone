'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import DemoRibbon from '@/components/ui/DemoRibbon';
import {
  DEMO_USER_BY_ROLE,
  EMERGENCIES,
  PROJECTS,
  SPEAKERS,
  TEMPLATES,
  USERS,
  type Emergency,
  type Project,
  type Speaker,
  type Template,
  type User,
} from '@/lib/mock';
import { getCurrentUser } from '@/lib/role';

const EMERGENCY_GLYPHS: Record<string, string> = { fire: '🔥', flood: '🌊', earthquake: '🌐', criminal: '⚠️', general: '🚨' };
const EMERGENCY_COLORS: Record<string, string> = { red: '#dc2626', blue: '#2563eb', orange: '#ea580c', amber: '#d97706' };

interface PendingTarget {
  kind: 'single' | 'group' | 'template' | 'emergency';
  speakers: Speaker[];
  emergency?: Emergency;
  template?: Template;
}

interface ConfirmDialog {
  title: string;
  detail: string;
  icon: string;
  target: PendingTarget | null;
}

export default function VillageHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [confirm, setConfirm] = useState<ConfirmDialog | null>(null);
  const [showEmPicker, setShowEmPicker] = useState(false);

  useEffect(() => {
    const u = getCurrentUser() || USERS.find(x => x.username === DEMO_USER_BY_ROLE.headVillage) || null;
    setUser(u);
    setProject(u && u.projectId ? PROJECTS.find(p => p.id === u.projectId) || null : null);
  }, []);

  const mySpeakers: Speaker[] = useMemo(() => {
    if (!user) return [];
    return (user.assignedSpeakers || []).map(id => SPEAKERS.find(s => s.id === id)).filter(Boolean) as Speaker[];
  }, [user]);

  const dateStr = useMemo(() => {
    const monthsTH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const daysTH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const now = new Date();
    return `วัน${daysTH[now.getDay()]}ที่ ${now.getDate()} ${monthsTH[now.getMonth()]} ${now.getFullYear() + 543}`;
  }, []);

  function askConfirm(opts: ConfirmDialog) { setConfirm(opts); }

  function handleConfirmYes() {
    if (!confirm || !confirm.target) {
      setConfirm(null);
      return;
    }
    const t = confirm.target;
    sessionStorage.setItem('villageCall', JSON.stringify({
      kind: t.kind,
      emergencyId: t.emergency ? t.emergency.id : null,
      templateId: t.template ? t.template.id : null,
      speakerIds: (t.speakers || []).map(s => s.id),
    }));
    router.push('/village/call');
  }

  return (
    <div className="elder-body">
      <DemoRibbon />

      <div className="elder-screen">
        <section className="bg-white border-2 border-slate-200 rounded-3xl p-5 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-3xl flex-shrink-0">👴</div>
            <div className="flex-1 min-w-0">
              <div className="text-base text-slate-500">สวัสดีครับ</div>
              <div className="text-2xl font-bold text-slate-900 truncate">{user ? user.name : 'ผู้ใหญ่บ้าน'}</div>
              <div className="text-base text-slate-600 truncate">{project ? project.name : '—'}</div>
            </div>
          </div>
          <div className="mt-3 text-base text-slate-500">📅 {dateStr}</div>
        </section>

        <button
          onClick={() => {
            if (mySpeakers.length === 0) {
              askConfirm({ title: 'ยังไม่มีลำโพงที่กำหนดให้คุณ', detail: 'กรุณาติดต่อผู้ดูแลระบบ', icon: '⚠️', target: null });
              return;
            }
            askConfirm({
              title: 'ประกาศไปยังทุกจุดใช่ไหม?',
              detail: `เสียงของคุณจะออกลำโพงทั้ง ${mySpeakers.filter(s => s.online).length} จุดในหมู่บ้านพร้อมกัน`,
              icon: '📢',
              target: { kind: 'group', speakers: mySpeakers.filter(s => s.online) },
            });
          }}
          className="btn-elder-primary mb-3"
        >
          <span style={{ fontSize: 34 }}>📢</span>
          <span>ประกาศไปยังทุกจุดในหมู่บ้าน</span>
        </button>

        <button onClick={() => setShowEmPicker(true)} className="btn-elder-emergency mb-6">
          <span style={{ fontSize: 34 }}>🚨</span>
          <span>แจ้งเหตุฉุกเฉิน</span>
        </button>

        <h2 className="mb-3">ลำโพงในหมู่บ้านของคุณ</h2>
        <div className="space-y-3 mb-7">
          {mySpeakers.length === 0 && (
            <div className="elder-card">ยังไม่มีลำโพงที่กำหนดให้คุณ — โปรดติดต่อผู้ดูแลระบบ</div>
          )}
          {mySpeakers.map(s => (
            <div key={s.id} className={`elder-card ${s.online ? 'online' : 'offline'}`}>
              <div className="flex-shrink-0" style={{ fontSize: 40 }}>{s.online ? '🟢' : '⚪'}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 truncate" style={{ fontSize: 20 }}>{s.name}</div>
                <div style={{ fontSize: 16, color: s.online ? '#15803d' : '#94a3b8' }}>
                  {s.online ? 'ออนไลน์ พร้อมประกาศ' : 'ออฟไลน์ ไม่สามารถประกาศได้'}
                </div>
              </div>
              <button
                disabled={!s.online}
                onClick={() => askConfirm({
                  title: `ประกาศไปยัง ${s.name}?`,
                  detail: 'เสียงของคุณจะออกลำโพงจุดนี้ทันที',
                  icon: '📢',
                  target: { kind: 'single', speakers: [s] },
                })}
                className={s.online ? 'bg-blue-600 text-white font-bold rounded-2xl px-5' : 'bg-slate-200 text-slate-400 font-bold rounded-2xl px-5'}
                style={{ minHeight: 60, fontSize: 18 }}
              >
                📢 ประกาศ
              </button>
            </div>
          ))}
        </div>

        <h2 className="mb-3">ข้อความสำเร็จรูป</h2>
        <p className="text-base text-slate-500 mb-3">กดเพื่อประกาศข้อความสำเร็จรูปได้ทันที</p>
        <div className="grid grid-cols-2 gap-3 mb-7">
          {TEMPLATES.slice(0, 6).map(t => (
            <button
              key={t.id}
              onClick={() => askConfirm({
                title: `เล่นข้อความ "${t.name}"?`,
                detail: 'ระบบจะเล่นไฟล์เสียงผ่านลำโพงทุกจุดในหมู่บ้านของคุณ',
                icon: t.icon,
                target: { kind: 'template', speakers: mySpeakers, template: t },
              })}
              className="elder-tile"
            >
              <div className="icon">{t.icon}</div>
              <div className="name">{t.name}</div>
            </button>
          ))}
        </div>
      </div>

      <nav className="elder-bottombar">
        <Link href="/village" className="active"><span className="ic">🏠</span><span>หน้าหลัก</span></Link>
        <Link href="/village/history"><span className="ic">📜</span><span>ประวัติ</span></Link>
        <Link href="/"><span className="ic">🚪</span><span>ออก</span></Link>
      </nav>

      {/* Confirm dialog */}
      {confirm && (
        <div className="elder-confirm">
          <div className="elder-confirm-card">
            <div className="text-5xl mb-3">{confirm.icon}</div>
            <h2>{confirm.title}</h2>
            <p className="mb-5">{confirm.detail}</p>
            <div className="space-y-3">
              <button onClick={handleConfirmYes} className="btn-elder-primary">
                <span style={{ fontSize: 30 }}>✓</span>
                <span>ใช่ เริ่มประกาศ</span>
              </button>
              <button onClick={() => setConfirm(null)} className="btn-elder-secondary">
                <span style={{ fontSize: 24 }}>✕</span>
                <span>ไม่ ยกเลิก</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency picker */}
      {showEmPicker && (
        <div className="elder-confirm">
          <div className="elder-confirm-card">
            <div className="text-5xl mb-3">🚨</div>
            <h2>เลือกประเภทเหตุฉุกเฉิน</h2>
            <p className="mb-5">ระบบจะเล่นเสียงเตือนภัยเฉพาะประเภท</p>
            <div className="space-y-3">
              {EMERGENCIES.map(em => (
                <button
                  key={em.id}
                  className="btn-elder-secondary"
                  style={{ borderColor: EMERGENCY_COLORS[em.palette] || '#dc2626' }}
                  onClick={() => {
                    setShowEmPicker(false);
                    askConfirm({
                      title: `ยืนยันประกาศเหตุ "${em.name}"?`,
                      detail: 'ระบบจะเล่นเสียงเตือนภัยทันทีบนลำโพงทุกจุดในหมู่บ้าน',
                      icon: EMERGENCY_GLYPHS[em.id] || '🚨',
                      target: { kind: 'emergency', speakers: mySpeakers, emergency: em },
                    });
                  }}
                >
                  <span style={{ fontSize: 32 }}>{EMERGENCY_GLYPHS[em.id] || '🚨'}</span>
                  <div className="flex-1 text-left">
                    <div className="font-bold" style={{ fontSize: 20, color: EMERGENCY_COLORS[em.palette] || '#dc2626' }}>{em.name}</div>
                    <div style={{ fontSize: 15, color: '#64748b' }}>เบอร์ {em.ext}</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowEmPicker(false)} className="btn-elder-secondary mt-3">
              <span style={{ fontSize: 24 }}>✕</span>
              <span>ปิด</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
