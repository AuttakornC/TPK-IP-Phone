'use client';

import { DEMO_USER_BY_ROLE, PROJECTS, ROLE_LABEL, USERS, type RoleId, type Project, type User } from './mock';

const ROLE_KEY = 'paRole';
const USER_KEY = 'paUsername';

export function setDemoUser(role: RoleId, username: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USER_KEY, username);
}

export function getCurrentRole(): RoleId {
  if (typeof window === 'undefined') return 'authority';
  return (localStorage.getItem(ROLE_KEY) as RoleId) || 'authority';
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const username = localStorage.getItem(USER_KEY);
  if (username) {
    const u = USERS.find(x => x.username === username);
    if (u) return u;
  }
  const role = getCurrentRole();
  const fallback = DEMO_USER_BY_ROLE[role];
  return USERS.find(x => x.username === fallback) || null;
}

export function getCurrentProject(): Project | null {
  const u = getCurrentUser();
  if (!u || !u.projectId) return null;
  return PROJECTS.find(p => p.id === u.projectId) || null;
}

export function landingForRole(role: RoleId): string {
  const map: Record<RoleId, string> = {
    admin: '/admin/dashboard',
    authority: '/app',
    officer: '/app',
    headVillage: '/village',
  };
  return map[role] || '/';
}

export function loginAsRole(role: RoleId): string {
  const username = DEMO_USER_BY_ROLE[role];
  if (username) setDemoUser(role, username);
  return landingForRole(role);
}

export function loginAsUser(username: string): string | null {
  const u = USERS.find(x => x.username === username);
  if (!u) return null;
  setDemoUser(u.role, username);
  return landingForRole(u.role);
}

export const ROLE_BADGE_PALETTE: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  red: 'bg-red-100 text-red-700 ring-red-200',
  blue: 'bg-blue-100 text-blue-700 ring-blue-200',
  green: 'bg-green-100 text-green-700 ring-green-200',
};

export function roleBadgeClass(role: RoleId): string {
  const r = ROLE_LABEL[role];
  return ROLE_BADGE_PALETTE[r?.color || 'slate'] || ROLE_BADGE_PALETTE.slate;
}
