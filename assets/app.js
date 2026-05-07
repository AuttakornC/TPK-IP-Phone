// Wireless PA — control panel interactions (prototype only, no real SIP)
// Authority + Officer share this page. Officer hides "ผู้ใช้" nav link only.

const state = {
  zone: 'all',
  search: '',
  selected: new Set(),
  call: { timer: null, seconds: 0, muted: false, micInterval: null },
  pendingEmergency: null,
};

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'on') {
      for (const [evt, fn] of Object.entries(v)) el.addEventListener(evt, fn);
    } else if (k === 'data') {
      for (const [dk, dv] of Object.entries(v)) el.dataset[dk] = dv;
    } else if (k === 'style' && typeof v === 'object') {
      Object.assign(el.style, v);
    } else if (k in el && typeof el[k] !== 'object') {
      el[k] = v;
    } else {
      el.setAttribute(k, v);
    }
  }
  const list = Array.isArray(children) ? children : [children];
  for (const c of list) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

function icon(pathD, { className = 'w-4 h-4', strokeWidth = 2 } = {}) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', String(strokeWidth));
  svg.setAttribute('class', className);
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('stroke-linecap', 'round');
  p.setAttribute('stroke-linejoin', 'round');
  p.setAttribute('d', pathD);
  svg.appendChild(p);
  return svg;
}

const ICONS = {
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
};

function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

const PALETTE = {
  red:    { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-700',    iconBg: 'bg-red-600' },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-300',   text: 'text-blue-700',   iconBg: 'bg-blue-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', iconBg: 'bg-orange-600' },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700',  iconBg: 'bg-amber-600' },
};
const EMERGENCY_GLYPHS = { fire: '🔥', flood: '🌊', earthquake: '🌐', criminal: '⚠️', general: '🚨' };

const ROLE_BADGE_PALETTE = {
  red:   'bg-red-100 text-red-700 ring-red-200',
  blue:  'bg-blue-100 text-blue-700 ring-blue-200',
  green: 'bg-green-100 text-green-700 ring-green-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
};

// ============= ROLE-AWARE INIT =============
const currentUser = getCurrentUser();
const currentProject = getCurrentProject();
const currentRole = getCurrentRole();

// If admin lands here by mistake → bounce to admin dashboard
if (currentRole === 'admin') { window.location.href = 'admin-dashboard.html'; }
// If headVillage lands here → bounce to village home
if (currentRole === 'headVillage') { window.location.href = 'village.html'; }

function applyRoleHeader() {
  if (!currentUser) return;
  const r = ROLE_LABEL[currentRole];
  $('#userName').textContent = currentUser.name;
  const badge = $('#roleBadge');
  badge.textContent = r ? r.name : currentRole;
  badge.className = `inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded ring-1 ${ROLE_BADGE_PALETTE[r ? r.color : 'slate']}`;
  $('#projectName').textContent = currentProject ? `โครงการ: ${currentProject.name}` : '—';

  // Officer hides "ผู้ใช้" nav (cannot manage users)
  if (currentRole === 'officer') {
    document.querySelectorAll('[data-flag="users"]').forEach(el => el.remove());
  }
}

function projectSpeakers() {
  if (!currentProject) return SPEAKERS;
  return SPEAKERS.filter(s => s.projectId === currentProject.id);
}

// ============= EMERGENCY =============
function renderEmergencyGrid() {
  const grid = $('#emergencyGrid');
  clear(grid);
  EMERGENCIES.forEach(em => {
    const p = PALETTE[em.palette] || PALETTE.red;
    const btn = h('button', {
      class: `emergency-btn ${p.bg} ${p.border} border-2 rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md`,
      on: { click: () => askEmergencyConfirm(em) },
    }, [
      h('div', { class: `w-12 h-12 rounded-xl ${p.iconBg} text-white flex items-center justify-center text-2xl mb-2 shadow` }, [EMERGENCY_GLYPHS[em.id] || '🚨']),
      h('div', { class: `font-bold ${p.text}` }, [em.name]),
      h('div', { class: 'text-xs text-slate-500 mt-0.5' }, [`Ext. ${em.ext}`]),
    ]);
    grid.appendChild(btn);
  });
}

function askEmergencyConfirm(em) {
  state.pendingEmergency = em;
  $('#emConfirmName').textContent = em.name;
  $('#emConfirmExt').textContent = em.ext;
  const ttsLine = $('#emConfirmTts');
  if (em.tts) {
    ttsLine.textContent = `🗣️ "${em.tts}"`;
    ttsLine.classList.remove('hidden');
  } else {
    ttsLine.classList.add('hidden');
  }
  $('#emConfirmIcon').textContent = EMERGENCY_GLYPHS[em.id] || '🚨';
  $('#emergencyConfirm').classList.remove('hidden');
}

$('#btnEmergencyCancel').addEventListener('click', () => $('#emergencyConfirm').classList.add('hidden'));
$('#btnEmergencyConfirm').addEventListener('click', () => {
  $('#emergencyConfirm').classList.add('hidden');
  const em = state.pendingEmergency;
  if (!em) return;
  startCall({ kind: 'emergency', speakers: projectSpeakers(), emergency: em });
});

// ============= TEMPLATES =============
function renderTemplates() {
  const grid = $('#templatesGrid');
  clear(grid);
  TEMPLATES.forEach(t => {
    const card = h('button', {
      class: 'template-chip bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 text-left w-56 sm:w-auto flex-shrink-0',
      on: { click: () => startCall({ kind: 'template', speakers: projectSpeakers(), template: t }) },
    }, [
      h('div', { class: 'w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl flex-shrink-0' }, [t.icon]),
      h('div', { class: 'flex-1 min-w-0' }, [
        h('div', { class: 'font-semibold text-sm text-slate-900 truncate' }, [t.name]),
        h('div', { class: 'text-xs text-slate-500' }, [`${t.duration} · ${t.file}`]),
      ]),
    ]);
    grid.appendChild(card);
  });
}

// ============= ZONE TABS + SHORTCUTS =============
function renderZoneTabs() {
  const tabs = $('#zoneTabs');
  clear(tabs);
  ZONES.forEach(z => {
    const active = state.zone === z.id;
    const btn = h('button', {
      class: `zone-tab px-3.5 py-1.5 text-sm rounded-full border ${active ? 'bg-blue-900 text-white border-blue-900' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'}`,
      on: { click: () => { state.zone = z.id; renderZoneTabs(); renderSpeakers(); } },
    }, [z.name]);
    tabs.appendChild(btn);
  });

  const sc = $('#zoneShortcuts');
  clear(sc);
  ZONES.filter(z => z.id !== 'all').forEach(z => {
    const btn = h('button', {
      class: 'zone-shortcut px-2 py-1 text-xs rounded-md bg-slate-100 hover:bg-blue-100 hover:text-blue-700',
      on: { click: () => {
        projectSpeakers().filter(s => s.zone === z.id && s.online).forEach(s => state.selected.add(s.id));
        renderSpeakers(); renderSelected();
      } },
    }, [z.name]);
    sc.appendChild(btn);
  });
}

function filteredSpeakers() {
  const q = state.search.trim().toLowerCase();
  return projectSpeakers().filter(s => {
    if (state.zone !== 'all' && s.zone !== state.zone) return false;
    if (q && !(s.name.toLowerCase().includes(q) || s.ext.includes(q) || s.area.toLowerCase().includes(q))) return false;
    return true;
  });
}

// ============= SPEAKER GRID =============
function speakerCard(s) {
  const sel = state.selected.has(s.id);
  const cardClass = `speaker-card ${sel ? 'selected' : ''} ${!s.online ? 'offline' : ''} bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col gap-3`;

  const cb = h('input', {
    type: 'checkbox',
    class: 'select-cb w-5 h-5 rounded border-slate-300 text-blue-700 cursor-pointer',
    checked: sel,
    disabled: !s.online,
    on: { click: (e) => {
      e.stopPropagation();
      if (cb.checked) state.selected.add(s.id); else state.selected.delete(s.id);
      renderSpeakers(); renderSelected();
    } },
  });

  const callBtnClass = s.online
    ? 'call-btn px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100'
    : 'call-btn px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed';

  const callBtn = h('button', {
    class: callBtnClass,
    disabled: !s.online,
    on: { click: (e) => { e.stopPropagation(); if (s.online) startCall({ kind: 'single', speakers: [s] }); } },
  }, [
    h('span', { class: 'inline-flex items-center gap-1.5' }, [icon(ICONS.phone, { className: 'w-4 h-4' }), 'โทร']),
  ]);

  const statusDotClass = s.online ? 'w-2 h-2 rounded-full bg-green-500' : 'w-2 h-2 rounded-full bg-slate-300';
  const statusTextClass = `inline-flex items-center gap-1.5 text-xs font-medium ${s.online ? 'text-green-700' : 'text-slate-400'}`;

  const volumeRow = h('div', { class: 'flex items-center gap-2 text-xs text-slate-500' }, [
    h('span', {}, ['🔊']),
    h('div', { class: 'flex-1 meter-track' }, [
      h('div', { class: 'meter-fill ok', style: { width: `${s.volume}%` } }),
    ]),
    h('span', { class: 'font-mono text-slate-600 w-8 text-right' }, [`${s.volume}%`]),
  ]);

  return h('div', { class: cardClass, data: { id: s.id } }, [
    h('div', { class: 'flex items-start justify-between gap-2' }, [
      h('div', { class: 'flex-1 min-w-0' }, [
        h('div', { class: 'font-semibold text-slate-900 truncate' }, [s.name]),
        h('div', { class: 'text-xs text-slate-500 mt-0.5' }, [`Ext. ${s.ext} · ${s.area} · ${ZONE_LABEL[s.zone]}`]),
      ]),
      h('label', { class: 'flex-shrink-0' }, [cb]),
    ]),
    volumeRow,
    h('div', { class: 'flex items-center justify-between' }, [
      h('span', { class: statusTextClass }, [
        h('span', { class: statusDotClass }),
        s.online ? 'ออนไลน์' : 'ออฟไลน์',
      ]),
      callBtn,
    ]),
  ]);
}

function renderSpeakers() {
  const list = filteredSpeakers();
  const all = projectSpeakers();
  $('#speakerCount').textContent = `${list.length} จุดในมุมมองนี้ · ${all.filter(s=>s.online).length}/${all.length} จุดออนไลน์`;

  const grid = $('#speakerGrid');
  clear(grid);
  if (list.length === 0) {
    grid.appendChild(h('div', { class: 'col-span-full text-center text-slate-400 py-12' }, ['ไม่พบจุดประกาศตามเงื่อนไข']));
    return;
  }
  list.forEach(s => grid.appendChild(speakerCard(s)));
}

function renderSelected() {
  const ids = Array.from(state.selected);
  $('#selectedCount').textContent = String(ids.length);
  if (ids.length === 0) {
    $('#selectedNames').textContent = 'ยังไม่ได้เลือกจุดใด';
  } else {
    const names = ids.slice(0, 3).map(id => SPEAKERS.find(s => s.id === id).name);
    const extra = ids.length > 3 ? ` และอีก ${ids.length - 3} จุด` : '';
    $('#selectedNames').textContent = names.join(', ') + extra;
  }
  $('#btnGroupCall').disabled = ids.length === 0;
}

// ============= CALL OVERLAY =============
function startCall({ kind, speakers, emergency, template }) {
  const overlay = $('#callOverlay');
  const header = $('#callHeader');
  const ttsLine = $('#callTtsLine');

  header.className = 'p-6 text-white';
  ttsLine.classList.add('hidden');

  if (kind === 'single') {
    header.classList.add('bg-gradient-to-br', 'from-blue-900', 'to-blue-700');
    $('#callTarget').textContent = speakers[0].name;
    $('#callSubtarget').textContent = `Ext. ${speakers[0].ext} · ${speakers[0].area}`;
  } else if (kind === 'group') {
    header.classList.add('bg-gradient-to-br', 'from-blue-900', 'to-blue-700');
    $('#callTarget').textContent = `ประกาศพร้อมกัน ${speakers.length} จุด`;
    $('#callSubtarget').textContent = speakers.slice(0, 3).map(s => s.name).join(', ') + (speakers.length > 3 ? '...' : '');
  } else if (kind === 'emergency') {
    header.classList.add('bg-gradient-to-br', 'from-red-700', 'to-red-900');
    $('#callTarget').textContent = `${EMERGENCY_GLYPHS[emergency.id] || '🚨'} ${emergency.name}`;
    $('#callSubtarget').textContent = `Ext. ${emergency.ext} · ทุกจุด ${speakers.length} ลำโพง`;
    if (emergency.tts) {
      ttsLine.textContent = `กำลังอ่านสคริปต์: "${emergency.tts}"`;
      ttsLine.classList.remove('hidden');
    }
  } else if (kind === 'template') {
    header.classList.add('bg-gradient-to-br', 'from-indigo-800', 'to-blue-700');
    $('#callTarget').textContent = template.name;
    $('#callSubtarget').textContent = `เล่น "${template.file}" · ทุกจุดออนไลน์ · ${template.duration}`;
  } else if (kind === 'tts') {
    header.classList.add('bg-gradient-to-br', 'from-indigo-800', 'to-purple-700');
    $('#callTarget').textContent = '🗣️ ประกาศข้อความ TTS';
    $('#callSubtarget').textContent = `ทุกจุดออนไลน์ · ${speakers.length} ลำโพง`;
    ttsLine.textContent = `"${template}"`;
    ttsLine.classList.remove('hidden');
  }

  $('#callStatus').textContent = 'กำลังโทร...';
  $('#callTimer').textContent = '00:00';
  state.call.seconds = 0;
  state.call.muted = false;
  $('#muteLabel').textContent = 'ปิดไมค์';

  overlay.classList.remove('hidden');

  setTimeout(() => {
    $('#callStatus').textContent = kind === 'emergency' ? '● กำลังประกาศไซเรน' : '● กำลังประกาศ';
    state.call.timer = setInterval(() => {
      state.call.seconds++;
      const m = String(Math.floor(state.call.seconds / 60)).padStart(2, '0');
      const sec = String(state.call.seconds % 60).padStart(2, '0');
      $('#callTimer').textContent = `${m}:${sec}`;
    }, 1000);
    state.call.micInterval = setInterval(() => {
      const v = state.call.muted ? 0 : 20 + Math.random() * 70;
      $('#micBar').style.width = `${v}%`;
    }, 120);
  }, 1200);
}

function endCall() {
  $('#callOverlay').classList.add('hidden');
  clearInterval(state.call.timer);
  clearInterval(state.call.micInterval);
  state.call.timer = null;
  state.call.micInterval = null;
}

$('#btnHangup').addEventListener('click', endCall);
$('#btnMute').addEventListener('click', () => {
  state.call.muted = !state.call.muted;
  $('#muteLabel').textContent = state.call.muted ? 'เปิดไมค์' : 'ปิดไมค์';
  $('#btnMute').classList.toggle('bg-slate-100', state.call.muted);
});

// ============= GROUP =============
$('#btnGroupCall').addEventListener('click', () => {
  const speakers = Array.from(state.selected).map(id => SPEAKERS.find(s => s.id === id)).filter(Boolean);
  if (speakers.length) startCall({ kind: 'group', speakers });
});

// ============= TOP CONTROLS =============
$('#search').addEventListener('input', (e) => { state.search = e.target.value; renderSpeakers(); });
$('#btnSelectAll').addEventListener('click', () => {
  filteredSpeakers().filter(s => s.online).forEach(s => state.selected.add(s.id));
  renderSpeakers(); renderSelected();
});
$('#btnClear').addEventListener('click', () => { state.selected.clear(); renderSpeakers(); renderSelected(); });

// ============= TTS MODAL =============
function openTTS() { $('#ttsModal').classList.remove('hidden'); }
function closeTTS() { $('#ttsModal').classList.add('hidden'); }
const btnOpenTTS = $('#btnOpenTTS');
const btnOpenTTSMobile = $('#btnOpenTTSMobile');
if (btnOpenTTS) btnOpenTTS.addEventListener('click', openTTS);
if (btnOpenTTSMobile) btnOpenTTSMobile.addEventListener('click', openTTS);
$('#btnTTSClose').addEventListener('click', closeTTS);
$('#btnTTSSend').addEventListener('click', () => {
  const text = $('#ttsText').value.trim() || 'ทดสอบระบบ Text-to-Speech';
  closeTTS();
  startCall({ kind: 'tts', speakers: projectSpeakers().filter(s => s.online), template: text });
});

// ============= INIT =============
applyRoleHeader();
renderEmergencyGrid();
renderTemplates();
renderZoneTabs();
renderSpeakers();
renderSelected();
