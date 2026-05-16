// Mock data — placeholder Thai municipality scenario (v2: multi-tenant SaaS)
// Throwaway data for client demo. No real speakers, users, or logs.

export type RoleId = 'admin' | 'authority' | 'officer' | 'general';
export type ProjectStatus = 'active' | 'expiring' | 'expired';
export type LogType = 'emergency' | 'group' | 'single' | 'scheduled' | 'mp3';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  sipServerId: string;
  broadcastPrefix: string;
}

export type SpeakerStatus = 'idle' | 'busy';

export interface Speaker {
  id: string;
  name: string;
  ext: string;
  area: string;
  online: boolean;
  status: SpeakerStatus;
  volume: number;
  projectId: string;
}

export interface SipServer {
  id: string;
  name: string;
  domain: string;
  port: number;
  active: boolean;
}

// SIP credentials for a project user (1–1 with User). Plaintext on purpose —
// admin reads/edits these directly so they can be auto-supplied when the user
// broadcasts through their project's SIP server.
export interface UserSipCredentials {
  userId: string;
  ext: string;
  password: string;
}

export interface Emergency {
  id: string;
  name: string;
  ext: string;
  tone: string;
  palette: string;
}

export interface Template {
  id: string;
  name: string;
  icon: string;
  file: string;
  duration: string;
}

export interface User {
  name: string;
  role: RoleId;
  projectId: string | null;
  username: string;
  active: boolean;
  last: string;
  assignedSpeakers: string[];
}

export interface Role {
  id: RoleId;
  name: string;
  short: string;
  desc: string;
  color: string;
}

export interface PermissionRow {
  perm: string;
  admin: boolean;
  authority: boolean;
  officer: boolean;
  general: boolean;
}

export interface LogEntry {
  time: string;
  user: string;
  userId: string;
  projectId: string;
  target: string;
  duration: string;
  type: LogType;
  recording: boolean;
}

export interface Mp3File {
  name: string;
  size: string;
  uploaded: string;
  duration: string;
  projectId: string;
}

export interface Schedule {
  id: number;
  name: string;
  when: string;
  target: string;
  file: string;
  enabled: boolean;
  skipHolidays: boolean;
  projectId: string;
}

// ============= PROJECTS =============
export const PROJECTS: Project[] = [
  { id: 'p1', name: 'เทศบาลตำบลบางสะพาน', status: 'active', sipServerId: 'sv1', broadcastPrefix: '99' },
  { id: 'p2', name: 'อบต.ห้วยกระเจา', status: 'active', sipServerId: 'sv1', broadcastPrefix: '98' },
  { id: 'p3', name: 'เทศบาลเมืองฉะเชิงเทรา', status: 'expiring', sipServerId: 'sv2', broadcastPrefix: '99' },
  { id: 'p4', name: 'อบต.ดอนแก้ว (เก่า)', status: 'expired', sipServerId: 'sv1', broadcastPrefix: '' },
];

// ============= SIP SERVERS =============
// Vendor-managed SIP server domains. Global — every project is bound to one.
export const SIP_SERVERS: SipServer[] = [
  { id: 'sv1', name: 'SIP Server หลัก', domain: 'sip.tpk-pa.local', port: 5060, active: true },
  { id: 'sv2', name: 'SIP Server สำรอง', domain: 'sip-backup.tpk-pa.local', port: 5060, active: true },
];

// ============= SPEAKERS =============
export const SPEAKERS: Speaker[] = [
  // Project p1
  { id: 'sp01', name: 'ศาลาประชาคม', ext: '1001', area: 'หมู่ 1', online: true, status: 'idle', volume: 80, projectId: 'p1' },
  { id: 'sp02', name: 'ที่ทำการเทศบาล', ext: '1002', area: 'หมู่ 1', online: true, status: 'idle', volume: 75, projectId: 'p1' },
  { id: 'sp03', name: 'ตลาดสดเทศบาล', ext: '1003', area: 'หมู่ 1', online: true, status: 'idle', volume: 90, projectId: 'p1' },
  { id: 'sp04', name: 'โรงเรียนเทศบาล 1', ext: '2001', area: 'หมู่ 2', online: true, status: 'idle', volume: 70, projectId: 'p1' },
  { id: 'sp05', name: 'วัดเหนือ', ext: '2002', area: 'หมู่ 2', online: false, status: 'idle', volume: 60, projectId: 'p1' },
  { id: 'sp06', name: 'รพ.สต. หมู่ 3', ext: '2003', area: 'หมู่ 3', online: true, status: 'idle', volume: 75, projectId: 'p1' },
  { id: 'sp07', name: 'สวนสาธารณะ', ext: '3001', area: 'หมู่ 4', online: true, status: 'idle', volume: 80, projectId: 'p1' },
  { id: 'sp08', name: 'สนามกีฬาเทศบาล', ext: '3002', area: 'หมู่ 4', online: true, status: 'idle', volume: 85, projectId: 'p1' },
  { id: 'sp09', name: 'แยกไฟแดง', ext: '3003', area: 'หมู่ 5', online: true, status: 'idle', volume: 95, projectId: 'p1' },
  { id: 'sp10', name: 'วัดใต้', ext: '3004', area: 'หมู่ 5', online: true, status: 'idle', volume: 60, projectId: 'p1' },
  { id: 'sp11', name: 'โรงเรียนเทศบาล 2', ext: '4001', area: 'หมู่ 6', online: true, status: 'idle', volume: 75, projectId: 'p1' },
  { id: 'sp12', name: 'หอนาฬิกาประจำตำบล', ext: '4002', area: 'หมู่ 6', online: false, status: 'idle', volume: 80, projectId: 'p1' },
  { id: 'sp13', name: 'ตลาดนัดวันพุธ', ext: '5001', area: 'หมู่ 7', online: true, status: 'idle', volume: 90, projectId: 'p1' },
  { id: 'sp14', name: 'ทางเข้าหมู่บ้าน', ext: '5002', area: 'หมู่ 8', online: true, status: 'idle', volume: 80, projectId: 'p1' },

  // Project p2
  { id: 'sp15', name: 'ที่ทำการ อบต.', ext: '1101', area: 'หมู่ 1', online: true, status: 'idle', volume: 80, projectId: 'p2' },
  { id: 'sp16', name: 'วัดห้วยกระเจา', ext: '1102', area: 'หมู่ 1', online: true, status: 'idle', volume: 75, projectId: 'p2' },
  { id: 'sp17', name: 'โรงเรียนห้วยกระเจา', ext: '1103', area: 'หมู่ 2', online: true, status: 'idle', volume: 70, projectId: 'p2' },
  { id: 'sp18', name: 'รพ.สต. ห้วยกระเจา', ext: '1104', area: 'หมู่ 2', online: true, status: 'idle', volume: 80, projectId: 'p2' },
  { id: 'sp19', name: 'ลานเอนกประสงค์', ext: '1105', area: 'หมู่ 3', online: true, status: 'idle', volume: 85, projectId: 'p2' },
  { id: 'sp20', name: 'ทางเข้าตำบล', ext: '1106', area: 'หมู่ 3', online: true, status: 'idle', volume: 90, projectId: 'p2' },
  { id: 'sp21', name: 'ตลาดเช้า', ext: '1107', area: 'หมู่ 4', online: false, status: 'idle', volume: 75, projectId: 'p2' },
  { id: 'sp22', name: 'ศูนย์เด็กเล็ก', ext: '1108', area: 'หมู่ 4', online: true, status: 'idle', volume: 65, projectId: 'p2' },

  // Project p3
  { id: 'sp23', name: 'หน้าศาลากลาง', ext: '2101', area: 'เขต 1', online: true, status: 'idle', volume: 80, projectId: 'p3' },
  { id: 'sp24', name: 'ตลาดเทศบาล', ext: '2102', area: 'เขต 1', online: true, status: 'idle', volume: 90, projectId: 'p3' },
  { id: 'sp25', name: 'วงเวียนกลางเมือง', ext: '2103', area: 'เขต 2', online: true, status: 'idle', volume: 95, projectId: 'p3' },
  { id: 'sp26', name: 'สนามหลวง', ext: '2104', area: 'เขต 2', online: false, status: 'idle', volume: 80, projectId: 'p3' },
  { id: 'sp27', name: 'หน้าโรงพยาบาลศูนย์', ext: '2105', area: 'เขต 3', online: true, status: 'idle', volume: 85, projectId: 'p3' },
];

// ============= EMERGENCIES =============
export const EMERGENCIES: Emergency[] = [
  { id: 'fire', name: 'ไฟไหม้', ext: '001', tone: 'siren-fire.mp3', palette: 'red' },
  { id: 'flood', name: 'น้ำท่วม', ext: '002', tone: 'siren-flood.mp3', palette: 'blue' },
  { id: 'earthquake', name: 'แผ่นดินไหว', ext: '003', tone: 'siren-earthquake.mp3', palette: 'orange' },
  { id: 'criminal', name: 'ภัยจากคนร้าย', ext: '004', tone: 'siren-criminal.mp3', palette: 'amber' },
  { id: 'general', name: 'เตือนภัยทั่วไป', ext: '000', tone: 'siren-general.mp3', palette: 'red' },
];

// ============= TEMPLATES =============
export const TEMPLATES: Template[] = [
  { id: 't1', name: 'เชิญร่วมประชุม', icon: '📋', file: 'meeting.mp3', duration: '0:45' },
  { id: 't2', name: 'แจ้งดับน้ำประปา', icon: '💧', file: 'water-off.mp3', duration: '1:00' },
  { id: 't3', name: 'แจ้งดับไฟฟ้า', icon: '⚡', file: 'power-off.mp3', duration: '0:50' },
  { id: 't4', name: 'เชิญรับวัคซีน', icon: '💉', file: 'vaccine.mp3', duration: '1:15' },
  { id: 't5', name: 'พ่นยุง / กำจัดยุงลาย', icon: '🦟', file: 'mosquito.mp3', duration: '1:30' },
  { id: 't6', name: 'ตามหาบุคคล/ของหาย', icon: '🔎', file: 'lost.mp3', duration: '0:40' },
  { id: 't7', name: 'ฝนฟ้าคะนอง — ระวัง', icon: '⛈️', file: 'storm.mp3', duration: '0:35' },
  { id: 't8', name: 'งานบุญประจำปี', icon: '🎉', file: 'festival.mp3', duration: '1:10' },
];

// ============= USERS =============
export const USERS: User[] = [
  { name: 'นายชนะกานต์ ปาลิพล', role: 'admin', projectId: null, username: 'admin', active: true, last: '2026-05-07 15:00', assignedSpeakers: [] },

  { name: 'นายสมพงษ์ จันทร์ประดิษฐ์', role: 'authority', projectId: 'p1', username: 'somphong', active: true, last: '2026-05-07 14:30', assignedSpeakers: [] },
  { name: 'นายสมชาย วงศ์สวัสดิ์', role: 'officer', projectId: 'p1', username: 'somchai', active: true, last: '2026-05-07 13:15', assignedSpeakers: [] },
  { name: 'ลุงมานิตย์ มั่นใจ', role: 'general', projectId: 'p1', username: 'manit', active: true, last: '2026-05-07 09:45', assignedSpeakers: ['sp04','sp05','sp06'] },
  { name: 'ลุงสมศักดิ์ รักดี', role: 'general', projectId: 'p1', username: 'somsak', active: true, last: '2026-05-06 11:20', assignedSpeakers: ['sp07','sp08','sp09','sp10'] },

  { name: 'นางสุดา รักไทย', role: 'authority', projectId: 'p2', username: 'suda', active: true, last: '2026-05-07 10:00', assignedSpeakers: [] },
  { name: 'นายปกครอง สุขใจ', role: 'officer', projectId: 'p2', username: 'pokkrong', active: true, last: '2026-05-06 14:30', assignedSpeakers: [] },
  { name: 'ลุงเสถียร ดีงาม', role: 'general', projectId: 'p2', username: 'sathian', active: true, last: '2026-05-07 08:30', assignedSpeakers: ['sp19','sp20'] },

  { name: 'นายกฤษณะ พงษ์ไทย', role: 'authority', projectId: 'p3', username: 'kritsana', active: true, last: '2026-05-05 11:00', assignedSpeakers: [] },
  { name: 'นางสาวพิมพ์ แสนดี', role: 'officer', projectId: 'p3', username: 'pim', active: true, last: '2026-05-04 09:30', assignedSpeakers: [] },
];

export const DEMO_USER_BY_ROLE: Record<RoleId, string> = {
  admin: 'admin',
  authority: 'somphong',
  officer: 'somchai',
  general: 'manit',
};

// ============= USER SIP_SERVERS =============
// SIP credentials for every project user (1–1 with User). Globally-unique ext.
// Project p1 + p2 register on as1; p3 on as2 (matches the speaker assignment).
export const USER_SIP_CREDENTIALS: UserSipCredentials[] = [
  { userId: 'somphong', ext: '9001', password: 'sip-somphong-7q2x' },
  { userId: 'somchai', ext: '9002', password: 'sip-somchai-k3vp'  },
  { userId: 'manit', ext: '9003', password: 'sip-manit-9zwa'    },
  { userId: 'somsak', ext: '9004', password: 'sip-somsak-bm4t'   },
  { userId: 'suda', ext: '9005', password: 'sip-suda-xq7n'     },
  { userId: 'pokkrong', ext: '9006', password: 'sip-pokkrong-h2dy' },
  { userId: 'sathian', ext: '9007', password: 'sip-sathian-r6lq'  },
  { userId: 'kritsana', ext: '9008', password: 'sip-kritsana-pf3e' },
  { userId: 'pim', ext: '9009', password: 'sip-pim-c8jw'      },
];

// ============= ROLES =============
export const ROLES: Role[] = [
  { id: 'admin', name: 'ผู้ดูแลระบบ', short: 'Admin', desc: 'จัดการโครงการ ผู้ใช้ และจุดประกาศทั้งหมด · ระดับ vendor', color: 'slate' },
  { id: 'authority', name: 'ผู้บริหาร', short: 'Authority', desc: 'ผู้บริหารโครงการ — ใช้ได้ทุกฟังก์ชันในโครงการของตน', color: 'red' },
  { id: 'officer', name: 'เจ้าหน้าที่', short: 'Officer', desc: 'ประกาศ ตั้งเวลา จัดการ MP3 · ดู log ของโครงการ', color: 'blue' },
  { id: 'general', name: 'ทั่วไป', short: 'General', desc: 'ประกาศไปยังลำโพงที่รับผิดชอบ · ใช้บนมือถือ', color: 'green' },
];

export const ROLE_LABEL: Record<RoleId, Role> = Object.fromEntries(ROLES.map(r => [r.id, r])) as Record<RoleId, Role>;

export const PERMISSION_MATRIX: PermissionRow[] = [
  { perm: 'ประกาศจุดเดียว', admin: false, authority: true, officer: true, general: true },
  { perm: 'ประกาศกลุ่ม / หลายจุด', admin: false, authority: true, officer: true, general: true },
  { perm: 'เตือนภัยพิบัติ', admin: false, authority: true, officer: true, general: true },
  { perm: 'ใช้ template', admin: false, authority: true, officer: true, general: true },
  { perm: 'อัปโหลด MP3', admin: false, authority: true, officer: true, general: false },
  { perm: 'ตั้งเวลาประกาศ', admin: false, authority: true, officer: true, general: false },
  { perm: 'ดู log ของโครงการ', admin: true, authority: true, officer: true, general: false },
  { perm: 'ดู log ของตัวเอง', admin: true, authority: true, officer: true, general: true },
  { perm: 'จัดการผู้ใช้ในโครงการ', admin: true, authority: false, officer: false, general: false },
  { perm: 'จัดการโครงการทั้งหมด', admin: true, authority: false, officer: false, general: false },
  { perm: 'สร้าง/แก้ไขจุดประกาศ', admin: true, authority: false, officer: false, general: false },
  { perm: 'Assign จุดให้ผู้ใช้ทั่วไป', admin: true, authority: false, officer: false, general: false },
];

// ============= LOGS =============
export const LOG_ENTRIES: LogEntry[] = [
  { time: '2026-05-07 14:32:15', user: 'นายสมพงษ์ จันทร์ประดิษฐ์', userId: 'somphong', projectId: 'p1', target: 'ทุกจุด (เตือนภัย 000)', duration: '0:45', type: 'emergency', recording: true },
  { time: '2026-05-07 13:15:02', user: 'นายสมชาย วงศ์สวัสดิ์', userId: 'somchai', projectId: 'p1', target: 'โซนเหนือ (3 จุด)', duration: '1:20', type: 'group', recording: true },
  { time: '2026-05-07 11:00:00', user: 'ระบบอัตโนมัติ', userId: 'system', projectId: 'p1', target: 'ทุกจุด (MP3: ประจำวัน-เที่ยง)', duration: '0:30', type: 'scheduled', recording: false },
  { time: '2026-05-07 09:45:30', user: 'ลุงมานิตย์ มั่นใจ', userId: 'manit', projectId: 'p1', target: 'รพ.สต. หมู่ 3', duration: '2:15', type: 'single', recording: true },
  { time: '2026-05-06 16:20:11', user: 'ลุงมานิตย์ มั่นใจ', userId: 'manit', projectId: 'p1', target: 'โรงเรียนเทศบาล 1, รพ.สต. หมู่ 3', duration: '0:55', type: 'group', recording: true },
  { time: '2026-05-06 08:00:00', user: 'ระบบอัตโนมัติ', userId: 'system', projectId: 'p1', target: 'ทุกจุด (MP3: เคารพธงชาติ)', duration: '0:30', type: 'mp3', recording: false },
  { time: '2026-05-06 07:15:42', user: 'นายสมพงษ์ จันทร์ประดิษฐ์', userId: 'somphong', projectId: 'p1', target: 'โซนกลาง (3 จุด)', duration: '3:10', type: 'group', recording: true },
  { time: '2026-05-05 18:00:00', user: 'ระบบอัตโนมัติ', userId: 'system', projectId: 'p1', target: 'ทุกจุด (MP3: เคารพธงชาติ)', duration: '0:30', type: 'mp3', recording: false },
  { time: '2026-05-05 14:50:22', user: 'นายสมชาย วงศ์สวัสดิ์', userId: 'somchai', projectId: 'p1', target: 'โรงเรียนเทศบาล 1', duration: '1:45', type: 'single', recording: true },
  { time: '2026-05-05 10:30:18', user: 'ลุงสมศักดิ์ รักดี', userId: 'somsak', projectId: 'p1', target: 'โซนใต้ (4 จุด)', duration: '2:30', type: 'group', recording: true },
];

// ============= MP3 + SCHEDULES + STATUS =============
export const MP3_FILES: Mp3File[] = [
  { name: 'เคารพธงชาติ.mp3', size: '2.3 MB', uploaded: '2026-04-15', duration: '0:30', projectId: 'p1' },
  { name: 'ประจำวัน-เช้า.mp3', size: '1.8 MB', uploaded: '2026-04-12', duration: '1:15', projectId: 'p1' },
  { name: 'ประจำวัน-เที่ยง.mp3', size: '1.6 MB', uploaded: '2026-04-12', duration: '0:30', projectId: 'p1' },
  { name: 'ประชาสัมพันธ์ฉีดวัคซีน.mp3', size: '3.1 MB', uploaded: '2026-04-10', duration: '2:00', projectId: 'p1' },
  { name: 'เพลงสรรเสริญพระบารมี.mp3', size: '4.2 MB', uploaded: '2026-04-01', duration: '2:45', projectId: 'p1' },
  { name: 'ประกาศกำจัดยุงลาย.mp3', size: '2.7 MB', uploaded: '2026-03-20', duration: '1:30', projectId: 'p1' },
];

export const SCHEDULES: Schedule[] = [
  { id: 1, name: 'เคารพธงชาติเช้า', when: 'ทุกวัน 08:00', target: 'ทุกจุด', file: 'เคารพธงชาติ.mp3', enabled: true, skipHolidays: true, projectId: 'p1' },
  { id: 2, name: 'ประจำวันเที่ยง', when: 'ทุกวัน 12:00', target: 'ทุกจุด', file: 'ประจำวัน-เที่ยง.mp3', enabled: true, skipHolidays: false, projectId: 'p1' },
  { id: 3, name: 'เคารพธงชาติเย็น', when: 'ทุกวัน 18:00', target: 'ทุกจุด', file: 'เคารพธงชาติ.mp3', enabled: true, skipHolidays: true, projectId: 'p1' },
  { id: 4, name: 'ประชาสัมพันธ์ตลาดนัด', when: 'พุธ 06:30', target: 'โซนตะวันตก', file: 'ประจำวัน-เช้า.mp3', enabled: true, skipHolidays: false, projectId: 'p1' },
  { id: 5, name: 'ประกาศกำจัดยุงลาย', when: 'อาทิตย์ที่ 1 ของเดือน 09:00', target: 'ทุกจุด', file: 'ประกาศกำจัดยุงลาย.mp3', enabled: false, skipHolidays: false, projectId: 'p1' },
];

export const SYSTEM_STATUS = {
  sipServer: { status: 'ok' as const, uptime: '14 วัน 3 ชม.', cpu: 12, mem: 38, version: '20.4.0' },
  webApp: { status: 'ok' as const, uptime: '2 วัน 8 ชม.', cpu: 5, mem: 22, version: '1.0.0-beta' },
  database: { status: 'ok' as const, uptime: '14 วัน 3 ชม.', size: '184 MB' },
  storage: { used: 4.2, total: 50, unit: 'GB', logRetention: 90, recordingRetention: 90 },
  network: { latency: 12, lossPercent: 0, wssOnline: true },
  speakers: { online: 12, total: 14, lastCheck: '2 นาทีที่แล้ว' },
  globalSpeakers: { online: 28, total: 33 },
  backup: { last: '2026-05-07 02:00', size: '4.1 GB', status: 'ok' as const, next: '2026-05-08 02:00' },
  ssl: { issuer: "Let's Encrypt", validUntil: '2026-07-15', daysLeft: 69 },
  recentIssues: [
    { time: '2026-05-07 03:14', severity: 'warning' as const, message: 'วัดเหนือ (p1) ไม่ตอบสนอง > 5 นาที' },
    { time: '2026-05-06 22:08', severity: 'info' as const, message: 'หอนาฬิกา (p1) กลับมา online' },
    { time: '2026-05-06 22:03', severity: 'warning' as const, message: 'หอนาฬิกา (p1) offline' },
    { time: '2026-05-05 02:00', severity: 'info' as const, message: 'Backup สำเร็จ (4.1 GB)' },
    { time: '2026-05-04 14:22', severity: 'info' as const, message: 'อัปเดตระบบ Web App เป็น 1.0.0-beta' },
  ],
};

export const TYPE_LABEL: Record<LogType, { text: string; class: string }> = {
  emergency: { text: 'เตือนภัย', class: 'bg-red-100 text-red-700 ring-red-200' },
  group: { text: 'ประกาศกลุ่ม', class: 'bg-blue-100 text-blue-700 ring-blue-200' },
  single: { text: 'จุดเดียว', class: 'bg-slate-100 text-slate-700 ring-slate-200' },
  scheduled: { text: 'ตั้งเวลา', class: 'bg-violet-100 text-violet-700 ring-violet-200' },
  mp3: { text: 'MP3', class: 'bg-amber-100 text-amber-800 ring-amber-200' },
};
