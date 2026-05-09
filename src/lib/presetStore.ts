'use client';

import { EMERGENCIES, TEMPLATES } from './mock';

const EM_KEY = 'paEmergencyPresets';
const TPL_KEY = 'paTemplatePresets';

/**
 * 'mp3'           = play the MP3 file only (no live mic).
 * 'mp3-then-mic'  = play the MP3 as intro, then open the user's mic to talk live.
 */
export type PlayMode = 'mp3' | 'mp3-then-mic';

export interface EmergencyPreset {
  id: string;
  name: string;
  icon: string;
  ext: string;
  palette: string;
  /** File name from the project's uploaded MP3 library (when set, plays instead of generic siren). */
  mp3Name?: string;
  /** Original siren tone identifier — kept for legacy presets that have no library MP3. */
  tone?: string;
  /** Default 'mp3-then-mic' — siren intro then user broadcasts live. */
  playMode?: PlayMode;
  custom?: boolean;
}

export interface TemplatePreset {
  id: string;
  name: string;
  icon: string;
  /** File name from the project's uploaded MP3 library. */
  mp3Name?: string;
  /** Legacy demo file name — used only when mp3Name is not set. */
  file?: string;
  duration: string;
  /** Default 'mp3' — pre-recorded clips just play. */
  playMode?: PlayMode;
  custom?: boolean;
}

type Bucket<T> = Record<string, T[]>; // keyed by projectId

function loadBucket<T>(key: string): Bucket<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Bucket<T>;
  } catch {
    return null;
  }
}

function saveBucket<T>(key: string, data: Bucket<T>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function seedEmergencies(): EmergencyPreset[] {
  return EMERGENCIES.map(e => ({
    id: e.id,
    name: e.name,
    icon: emergencyGlyph(e.id),
    ext: e.ext,
    palette: e.palette,
    tone: e.tone,
    playMode: 'mp3-then-mic',
    custom: false,
  }));
}

function seedTemplates(): TemplatePreset[] {
  return TEMPLATES.map(t => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    file: t.file,
    duration: t.duration,
    playMode: 'mp3',
    custom: false,
  }));
}

function emergencyGlyph(id: string): string {
  const map: Record<string, string> = { fire: '🔥', flood: '🌊', earthquake: '🌐', criminal: '⚠️', general: '🚨' };
  return map[id] || '🚨';
}

export function listEmergencyPresets(projectId: string): EmergencyPreset[] {
  const bucket = loadBucket<EmergencyPreset>(EM_KEY) ?? {};
  if (!bucket[projectId]) {
    bucket[projectId] = seedEmergencies();
    saveBucket(EM_KEY, bucket);
  }
  return bucket[projectId];
}

export function saveEmergencyPreset(projectId: string, preset: EmergencyPreset): EmergencyPreset[] {
  const bucket = loadBucket<EmergencyPreset>(EM_KEY) ?? {};
  const list = bucket[projectId] ?? seedEmergencies();
  const idx = list.findIndex(p => p.id === preset.id);
  if (idx >= 0) list[idx] = preset;
  else list.push(preset);
  bucket[projectId] = list;
  saveBucket(EM_KEY, bucket);
  return list;
}

export function deleteEmergencyPreset(projectId: string, id: string): EmergencyPreset[] {
  const bucket = loadBucket<EmergencyPreset>(EM_KEY) ?? {};
  const list = (bucket[projectId] ?? seedEmergencies()).filter(p => p.id !== id);
  bucket[projectId] = list;
  saveBucket(EM_KEY, bucket);
  return list;
}

export function listTemplatePresets(projectId: string): TemplatePreset[] {
  const bucket = loadBucket<TemplatePreset>(TPL_KEY) ?? {};
  if (!bucket[projectId]) {
    bucket[projectId] = seedTemplates();
    saveBucket(TPL_KEY, bucket);
  }
  return bucket[projectId];
}

export function saveTemplatePreset(projectId: string, preset: TemplatePreset): TemplatePreset[] {
  const bucket = loadBucket<TemplatePreset>(TPL_KEY) ?? {};
  const list = bucket[projectId] ?? seedTemplates();
  const idx = list.findIndex(p => p.id === preset.id);
  if (idx >= 0) list[idx] = preset;
  else list.push(preset);
  bucket[projectId] = list;
  saveBucket(TPL_KEY, bucket);
  return list;
}

export function deleteTemplatePreset(projectId: string, id: string): TemplatePreset[] {
  const bucket = loadBucket<TemplatePreset>(TPL_KEY) ?? {};
  const list = (bucket[projectId] ?? seedTemplates()).filter(p => p.id !== id);
  bucket[projectId] = list;
  saveBucket(TPL_KEY, bucket);
  return list;
}

export function newPresetId(prefix: 'em' | 'tpl'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
