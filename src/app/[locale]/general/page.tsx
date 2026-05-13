'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import DemoRibbon from '@/components/ui/DemoRibbon';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
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

export default function GeneralHomePage() {
  const router = useRouter();
  const t = useTranslations('general');
  const tEm = useTranslations('emergency.names');
  const tTpl = useTranslations('templates.names');
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [confirm, setConfirm] = useState<ConfirmDialog | null>(null);
  const [showEmPicker, setShowEmPicker] = useState(false);

  useEffect(() => {
    const u = getCurrentUser() || USERS.find(x => x.username === DEMO_USER_BY_ROLE.general) || null;
    setUser(u);
    setProject(u && u.projectId ? PROJECTS.find(p => p.id === u.projectId) || null : null);
  }, []);

  const mySpeakers: Speaker[] = useMemo(() => {
    if (!user) return [];
    return (user.assignedSpeakers || []).map(id => SPEAKERS.find(s => s.id === id)).filter(Boolean) as Speaker[];
  }, [user]);

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
      emergencyId: target.emergency ? target.emergency.id : null,
      templateId: target.template ? target.template.id : null,
      speakerIds: (target.speakers || []).map(s => s.id),
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
              <div className="text-2xl font-bold text-slate-900 truncate">{user ? user.name : t('fallbackName')}</div>
              <div className="text-base text-slate-600 truncate">{project ? project.name : '—'}</div>
            </div>
          </div>
          <div className="mt-3 text-base text-slate-500">📅 {dateStr}</div>
        </section>

        <button
          onClick={() => {
            if (mySpeakers.length === 0) {
              askConfirm({ title: t('confirm.noSpeakerTitle'), detail: t('confirm.noSpeakerDetail'), icon: '⚠️', target: null });
              return;
            }
            askConfirm({
              title: t('confirm.allTitle'),
              detail: t('confirm.allDetail', { count: mySpeakers.filter(s => s.online).length }),
              icon: '📢',
              target: { kind: 'group', speakers: mySpeakers.filter(s => s.online) },
            });
          }}
          className="btn-elder-primary mb-3"
        >
          <span style={{ fontSize: 34 }}>📢</span>
          <span>{t('broadcastAll')}</span>
        </button>

        <button onClick={() => setShowEmPicker(true)} className="btn-elder-emergency mb-6">
          <span style={{ fontSize: 34 }}>🚨</span>
          <span>{t('emergency')}</span>
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

        <h2 className="mb-3">{t('templateTitle')}</h2>
        <p className="text-base text-slate-500 mb-3">{t('templateSubtitle')}</p>
        <div className="grid grid-cols-2 gap-3 mb-7">
          {TEMPLATES.slice(0, 6).map(tpl => {
            const name = tTpl(tpl.id);
            return (
              <button
                key={tpl.id}
                onClick={() => askConfirm({
                  title: t('confirm.templateTitle', { name }),
                  detail: t('confirm.templateDetail'),
                  icon: tpl.icon,
                  target: { kind: 'template', speakers: mySpeakers, template: tpl },
                })}
                className="elder-tile"
              >
                <div className="icon">{tpl.icon}</div>
                <div className="name">{name}</div>
              </button>
            );
          })}
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

      {showEmPicker && (
        <div className="elder-confirm">
          <div className="elder-confirm-card">
            <div className="text-5xl mb-3">🚨</div>
            <h2>{t('emergencyPicker.title')}</h2>
            <p className="mb-5">{t('emergencyPicker.subtitle')}</p>
            <div className="space-y-3">
              {EMERGENCIES.map(em => {
                const name = tEm(em.id);
                return (
                  <button
                    key={em.id}
                    className="btn-elder-secondary"
                    style={{ borderColor: EMERGENCY_COLORS[em.palette] || '#dc2626' }}
                    onClick={() => {
                      setShowEmPicker(false);
                      askConfirm({
                        title: t('confirm.emergencyTitle', { name }),
                        detail: t('confirm.emergencyDetail'),
                        icon: EMERGENCY_GLYPHS[em.id] || '🚨',
                        target: { kind: 'emergency', speakers: mySpeakers, emergency: em },
                      });
                    }}
                  >
                    <span style={{ fontSize: 32 }}>{EMERGENCY_GLYPHS[em.id] || '🚨'}</span>
                    <div className="flex-1 text-left">
                      <div className="font-bold" style={{ fontSize: 20, color: EMERGENCY_COLORS[em.palette] || '#dc2626' }}>{name}</div>
                      <div style={{ fontSize: 15, color: '#64748b' }}>{t('emergencyPicker.ext', { ext: em.ext })}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowEmPicker(false)} className="btn-elder-secondary mt-3">
              <span style={{ fontSize: 24 }}>✕</span>
              <span>{t('emergencyPicker.close')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
