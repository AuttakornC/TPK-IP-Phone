'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import AppHeader from '@/components/AppHeader';
import DemoRibbon from '@/components/ui/DemoRibbon';
import BroadcastConfirmDialog from '@/components/app/BroadcastConfirmDialog';
import CallOverlay from '@/components/app/CallOverlay';
import EmergencyConfirmDialog from '@/components/app/EmergencyConfirmDialog';
import EmergencyGrid from '@/components/app/EmergencyGrid';
import GroupCallSidebar from '@/components/app/GroupCallSidebar';
import SpeakerCard from '@/components/app/SpeakerCard';
import TemplateStrip from '@/components/app/TemplateStrip';
import ZoneTabs from '@/components/app/ZoneTabs';
import type { CallState } from '@/components/app/types';
import { SPEAKERS, type Project, type Speaker } from '@/lib/mock';
import {
  listEmergencyPresets,
  listTemplatePresets,
  type EmergencyPreset,
  type TemplatePreset,
} from '@/lib/presetStore';
import { getCurrentProject, getCurrentRole } from '@/lib/role';

export default function ControlPanelPage() {
  const router = useRouter();
  const t = useTranslations('controlPanel');
  const [zone, setZone] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingEmergency, setPendingEmergency] = useState<EmergencyPreset | null>(null);
  const [pendingBroadcast, setPendingBroadcast] = useState<CallState | null>(null);
  const [emergencyPresets, setEmergencyPresets] = useState<EmergencyPreset[]>([]);
  const [templatePresets, setTemplatePresets] = useState<TemplatePreset[]>([]);
  const [call, setCall] = useState<CallState | null>(null);
  const [callStatus, setCallStatus] = useState(t('calling'));
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [micPct, setMicPct] = useState(0);
  const [project, setProject] = useState<Project | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const micRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mutedRef = useRef(false);

  useEffect(() => {
    const role = getCurrentRole();
    if (role === 'admin') router.replace('/admin/dashboard');
    else if (role === 'headVillage') router.replace('/village');
    const p = getCurrentProject();
    setProject(p);
    if (p) {
      setEmergencyPresets(listEmergencyPresets(p.id));
      setTemplatePresets(listTemplatePresets(p.id));
    }
  }, [router]);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const projectSpeakers = useMemo(() => {
    if (!project) return SPEAKERS;
    return SPEAKERS.filter(s => s.projectId === project.id);
  }, [project]);

  const filteredSpeakers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projectSpeakers.filter(s => {
      if (zone !== 'all' && s.zone !== zone) return false;
      if (q && !(s.name.toLowerCase().includes(q) || s.ext.includes(q) || s.area.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [projectSpeakers, zone, search]);

  const onlineCount = projectSpeakers.filter(s => s.online).length;

  function toggleSelected(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelected(prev => {
      const next = new Set(prev);
      filteredSpeakers.filter(s => s.online).forEach(s => next.add(s.id));
      return next;
    });
  }

  function clearSelection() { setSelected(new Set()); }

  function selectZone(zoneId: string) {
    setSelected(prev => {
      const next = new Set(prev);
      projectSpeakers.filter(s => s.zone === zoneId && s.online).forEach(s => next.add(s.id));
      return next;
    });
  }

  function startCall(c: CallState) {
    setCall(c);
    setSeconds(0);
    setMuted(false);
    setMicPct(0);
    setCallStatus(t('calling'));
    setTimeout(() => {
      // Decide the running status text based on play mode.
      let running: string;
      if (c.playMode === 'mp3') {
        running = t('playingMp3');
      } else if (c.playMode === 'mp3-then-mic') {
        running = c.kind === 'emergency' ? t('broadcastingSirenIntro') : t('playingIntro');
      } else if (c.kind === 'emergency') {
        running = t('broadcastingSiren');
      } else {
        running = t('broadcasting');
      }
      setCallStatus(running);

      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);

      // Only animate the mic level when the mic actually opens.
      if (c.playMode !== 'mp3') {
        micRef.current = setInterval(() => {
          setMicPct(() => (mutedRef.current ? 0 : 20 + Math.random() * 70));
        }, 120);
      }

      // For 'mp3-then-mic', simulate the intro-to-mic transition after a short delay.
      if (c.playMode === 'mp3-then-mic') {
        setTimeout(() => setCallStatus(t('broadcastingMicLive')), 2500);
      }
    }, 1200);
  }

  function endCall() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (micRef.current) clearInterval(micRef.current);
    timerRef.current = null;
    micRef.current = null;
    setCall(null);
  }

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (micRef.current) clearInterval(micRef.current);
  }, []);

  function confirmEmergency() {
    if (!pendingEmergency) return;
    const em = pendingEmergency;
    setPendingEmergency(null);
    startCall({
      kind: 'emergency',
      speakers: projectSpeakers,
      emergency: em,
      playMode: em.playMode ?? 'mp3-then-mic',
    });
  }

  function requestGroupCall() {
    const speakers = Array.from(selected).map(id => SPEAKERS.find(s => s.id === id)).filter(Boolean) as Speaker[];
    if (speakers.length) setPendingBroadcast({ kind: 'group', speakers });
  }

  function confirmBroadcast() {
    if (!pendingBroadcast) return;
    const next = pendingBroadcast;
    setPendingBroadcast(null);
    startCall(next);
  }

  const selectedNames = useMemo(() => {
    const ids = Array.from(selected);
    if (ids.length === 0) return t('noSelection');
    const names = ids.slice(0, 3).map(id => SPEAKERS.find(s => s.id === id)?.name || '').filter(Boolean);
    const extra = ids.length > 3 ? t('extraSpots', { count: ids.length - 3 }) : '';
    return names.join(', ') + extra;
  }, [selected, t]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <DemoRibbon />
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <EmergencyGrid presets={emergencyPresets} onPick={setPendingEmergency} />

        <TemplateStrip
          presets={templatePresets}
          onPick={tpl => setPendingBroadcast({
            kind: 'template',
            speakers: projectSpeakers,
            template: tpl,
            playMode: tpl.playMode ?? 'mp3',
          })}
        />

        <ZoneTabs
          zone={zone}
          onZoneChange={setZone}
          search={search}
          onSearchChange={setSearch}
          onSelectAll={selectAllFiltered}
          onClear={clearSelection}
          filteredCount={filteredSpeakers.length}
          onlineCount={onlineCount}
          totalCount={projectSpeakers.length}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredSpeakers.length === 0 && (
              <div className="col-span-full text-center text-slate-400 py-12">{t('noSpeakersFound')}</div>
            )}
            {filteredSpeakers.map(s => (
              <SpeakerCard
                key={s.id}
                speaker={s}
                selected={selected.has(s.id)}
                onToggle={() => toggleSelected(s.id)}
                onCall={() => setPendingBroadcast({ kind: 'single', speakers: [s] })}
              />
            ))}
          </section>

          <GroupCallSidebar
            selectedCount={selected.size}
            selectedNames={selectedNames}
            onCall={requestGroupCall}
            onSelectZone={selectZone}
          />
        </div>
      </main>

      <CallOverlay
        call={call}
        status={callStatus}
        seconds={seconds}
        micPct={micPct}
        muted={muted}
        onToggleMute={() => setMuted(m => !m)}
        onEnd={endCall}
      />

      <EmergencyConfirmDialog
        emergency={pendingEmergency}
        onCancel={() => setPendingEmergency(null)}
        onConfirm={confirmEmergency}
      />

      <BroadcastConfirmDialog
        pending={pendingBroadcast}
        onCancel={() => setPendingBroadcast(null)}
        onConfirm={confirmBroadcast}
      />
    </div>
  );
}
