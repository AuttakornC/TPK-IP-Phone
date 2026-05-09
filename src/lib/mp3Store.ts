'use client';

import { MP3_FILES, type Mp3File } from './mock';

const KEY = 'paMp3Library';

function load(): Mp3File[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Mp3File[];
  } catch {
    return null;
  }
}

function save(list: Mp3File[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

/** Returns the persisted library, seeding from mock if it's empty. */
export function listMp3(projectId?: string | null): Mp3File[] {
  const all = load() ?? MP3_FILES.slice();
  if (!load()) save(all);
  return projectId ? all.filter(f => f.projectId === projectId) : all;
}

export function addMp3(file: Mp3File): Mp3File[] {
  const all = load() ?? MP3_FILES.slice();
  const next = [file, ...all.filter(f => !(f.name === file.name && f.projectId === file.projectId))];
  save(next);
  return next;
}

export function renameMp3(projectId: string, oldName: string, newName: string): Mp3File[] {
  const all = load() ?? MP3_FILES.slice();
  const next = all.map(f =>
    f.projectId === projectId && f.name === oldName ? { ...f, name: newName } : f
  );
  save(next);
  return next;
}

export function deleteMp3(projectId: string, name: string): Mp3File[] {
  const all = load() ?? MP3_FILES.slice();
  const next = all.filter(f => !(f.projectId === projectId && f.name === name));
  save(next);
  return next;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function todayDate(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
