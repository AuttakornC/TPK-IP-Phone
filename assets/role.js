// Role detection + demo switcher (depends on mock.js + dom.js to be loaded first).
// Stores demo identity in localStorage:
//   - paRole:     admin | authority | officer | headVillage
//   - paUsername: username from USERS

const ROLE_KEY = 'paRole';
const USER_KEY = 'paUsername';

function setDemoUser(role, username) {
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USER_KEY, username);
}

function getCurrentRole() {
  return localStorage.getItem(ROLE_KEY) || 'authority';
}

function getCurrentUser() {
  const username = localStorage.getItem(USER_KEY);
  if (username) {
    const u = (typeof USERS !== 'undefined') ? USERS.find(x => x.username === username) : null;
    if (u) return u;
  }
  // fallback by role
  const role = getCurrentRole();
  const fallback = (typeof DEMO_USER_BY_ROLE !== 'undefined') ? DEMO_USER_BY_ROLE[role] : null;
  return (typeof USERS !== 'undefined') ? USERS.find(x => x.username === fallback) : null;
}

function getCurrentProject() {
  const u = getCurrentUser();
  if (!u || !u.projectId) return null;
  return (typeof PROJECTS !== 'undefined') ? PROJECTS.find(p => p.id === u.projectId) : null;
}

function landingForRole(role) {
  return ({
    admin:       'admin-dashboard.html',
    authority:   'app.html',
    officer:     'app.html',
    headVillage: 'village.html',
  })[role] || 'index.html';
}

function loginAsRole(role) {
  const username = (typeof DEMO_USER_BY_ROLE !== 'undefined') ? DEMO_USER_BY_ROLE[role] : null;
  if (username) setDemoUser(role, username);
  window.location.href = landingForRole(role);
}

function loginAsUser(username) {
  const u = USERS.find(x => x.username === username);
  if (!u) return;
  setDemoUser(u.role, username);
  window.location.href = landingForRole(u.role);
}

// Auto-update common header elements (#userName, #roleBadge, #projectName) when present
function updateStandardHeader() {
  const u = getCurrentUser();
  const r = ROLE_LABEL[getCurrentRole()];
  const p = getCurrentProject();

  const ROLE_BADGE_PALETTE = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    red:   'bg-red-100 text-red-700 ring-red-200',
    blue:  'bg-blue-100 text-blue-700 ring-blue-200',
    green: 'bg-green-100 text-green-700 ring-green-200',
  };

  const nameEl = document.getElementById('userName');
  if (nameEl && u) nameEl.textContent = u.name;

  const projEl = document.getElementById('projectName');
  if (projEl) projEl.textContent = p ? `โครงการ: ${p.name}` : '—';

  const badge = document.getElementById('roleBadge');
  if (badge && r) {
    badge.textContent = r.name;
    badge.className = `inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded ring-1 ${ROLE_BADGE_PALETTE[r.color] || ROLE_BADGE_PALETTE.slate}`;
  }

  // Officer cannot manage users — hide nav links
  if (getCurrentRole() === 'officer') {
    document.querySelectorAll('[data-flag="users"]').forEach(el => el.remove());
  }
}

// Auto-inject on DOMContentLoaded if not on index page
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.skipSwitcher === '1') return;
    updateStandardHeader();
  });
}
