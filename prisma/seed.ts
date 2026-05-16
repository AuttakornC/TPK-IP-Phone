import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  SIP_SERVERS,
  EMERGENCIES,
  LOG_ENTRIES,
  MP3_FILES,
  PROJECTS,
  SCHEDULES,
  SPEAKERS,
  TEMPLATES,
  USERS,
  USER_SIP_CREDENTIALS,
  type LogType,
  type ProjectStatus,
  type RoleId,
} from '../src/lib/mock';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PROJECT_STATUS_MAP = {
  active: 'ACTIVE',
  expiring: 'EXPIRING',
  expired: 'EXPIRED',
} as const satisfies Record<ProjectStatus, 'ACTIVE' | 'EXPIRING' | 'EXPIRED'>;

const ROLE_MAP = {
  authority: 'AUTHORITY',
  officer: 'OFFICER',
  general: 'GENERAL',
} as const satisfies Record<Exclude<RoleId, 'admin'>, 'AUTHORITY' | 'OFFICER' | 'GENERAL'>;

const LOG_TYPE_MAP = {
  emergency: 'EMERGENCY',
  group: 'GROUP',
  single: 'SINGLE',
  scheduled: 'SCHEDULED',
  mp3: 'MP3',
} as const satisfies Record<LogType, 'EMERGENCY' | 'GROUP' | 'SINGLE' | 'SCHEDULED' | 'MP3'>;

// "0:45" → 45, "1:20" → 80, "2:15" → 135
function parseDurationSec(s: string): number {
  const [m, sec] = s.split(':').map(Number);
  return (m || 0) * 60 + (sec || 0);
}

// "2.3 MB" → 2_411_724 (rough, MB only — good enough for demo)
function parseSizeBytes(s: string): bigint {
  const m = s.match(/^([\d.]+)\s*MB$/i);
  if (!m) return BigInt(0);
  return BigInt(Math.round(parseFloat(m[1]) * 1024 * 1024));
}

// Cron approximations for the demo schedules.
const CRON_BY_NAME: Record<string, string> = {
  เคารพธงชาติเช้า: '0 8 * * *',
  ประจำวันเที่ยง: '0 12 * * *',
  เคารพธงชาติเย็น: '0 18 * * *',
  ประชาสัมพันธ์ตลาดนัด: '30 6 * * 3',
  ประกาศกำจัดยุงลาย: '0 9 1-7 * 0',
};

async function main() {
  console.log('🌱 Seeding database...');

  // Wipe in dependency order. Cascade handles most, but explicit is safer.
  await prisma.logEntry.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.mp3File.deleteMany();
  await prisma.speakerAssignment.deleteMany();
  await prisma.speaker.deleteMany();
  await prisma.user.deleteMany();
  await prisma.project.deleteMany();
  await prisma.sipServer.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.template.deleteMany();
  await prisma.emergencyPreset.deleteMany();

  // ----- Global presets -----
  await prisma.emergencyPreset.createMany({
    data: EMERGENCIES.map(e => ({
      code: e.id,
      name: e.name,
      ext: e.ext,
      tonePath: e.tone,
      palette: e.palette,
      ttsScript: '',
    })),
  });
  await prisma.template.createMany({
    data: TEMPLATES.map(t => ({
      code: t.id,
      name: t.name,
      icon: t.icon,
      filePath: t.file,
      durationSec: parseDurationSec(t.duration),
    })),
  });
  console.log(`  ✓ ${EMERGENCIES.length} emergency presets, ${TEMPLATES.length} templates`);

  // ----- SIP servers (must precede projects — FK target) -----
  for (const a of SIP_SERVERS) {
    await prisma.sipServer.create({
      data: {
        id: a.id,
        name: a.name,
        domain: a.domain,
        port: a.port,
        active: a.active,
      },
    });
  }
  console.log(`  ✓ ${SIP_SERVERS.length} SIP servers`);

  // ----- Projects (preserving mock IDs so FKs are easy to follow) -----
  for (const p of PROJECTS) {
    await prisma.project.create({
      data: {
        id: p.id,
        name: p.name,
        status: PROJECT_STATUS_MAP[p.status],
        sipServerId: p.sipServerId,
        broadcastPrefix: p.broadcastPrefix,
      },
    });
  }
  console.log(`  ✓ ${PROJECTS.length} projects`);

  // ----- Admin -----
  const passwordHash = await bcrypt.hash(process.env.DEMO_LOGIN_PASSWORD || 'demo1234', 10);

  const adminMock = USERS.find(u => u.role === 'admin');
  if (adminMock) {
    await prisma.admin.create({
      data: {
        id: adminMock.username,
        name: adminMock.name,
        username: adminMock.username,
        passwordHash,
        active: adminMock.active,
        lastLoginAt: new Date(adminMock.last),
      },
    });
  }

  // ----- Users (project-scoped) -----
  const sipByUser = new Map(USER_SIP_CREDENTIALS.map(s => [s.userId, s]));
  const projectUsers = USERS.filter(u => u.role !== 'admin' && u.projectId);
  for (const u of projectUsers) {
    const sip = sipByUser.get(u.username);
    await prisma.user.create({
      data: {
        id: u.username,
        name: u.name,
        username: u.username,
        passwordHash,
        role: ROLE_MAP[u.role as Exclude<RoleId, 'admin'>],
        active: u.active,
        lastLoginAt: new Date(u.last),
        projectId: u.projectId!,
        sipExt: sip?.ext ?? null,
        sipPassword: sip?.password ?? null,
      },
    });
  }
  console.log(`  ✓ 1 admin + ${projectUsers.length} users`);

  // ----- Speakers (SIP server is inherited from the project) -----
  for (const s of SPEAKERS) {
    await prisma.speaker.create({
      data: {
        id: s.id,
        projectId: s.projectId,
        name: s.name,
        ext: s.ext,
        area: s.area,
        online: s.online,
        status: s.status === 'busy' ? 'BUSY' : 'IDLE',
        volume: s.volume,
      },
    });
  }
  console.log(`  ✓ ${SPEAKERS.length} speakers`);

  // ----- Speaker assignments (general user ↔ speakers) -----
  let assignmentCount = 0;
  for (const u of projectUsers) {
    for (const speakerId of u.assignedSpeakers) {
      await prisma.speakerAssignment.create({
        data: { userId: u.username, speakerId },
      });
      assignmentCount++;
    }
  }
  console.log(`  ✓ ${assignmentCount} speaker assignments`);

  // ----- MP3 files (owned by users — pick first general user per project) -----
  const mp3OwnerByProject = new Map<string, string>();
  for (const u of projectUsers) {
    if (u.role === 'general' && !mp3OwnerByProject.has(u.projectId!)) {
      mp3OwnerByProject.set(u.projectId!, u.username);
    }
  }
  for (const u of projectUsers) {
    if (!mp3OwnerByProject.has(u.projectId!)) {
      mp3OwnerByProject.set(u.projectId!, u.username);
    }
  }

  const mp3IdByKey = new Map<string, string>(); // key = `${projectId}:${name}`
  let mp3Count = 0;
  for (const f of MP3_FILES) {
    const ownerId = mp3OwnerByProject.get(f.projectId);
    if (!ownerId) continue;
    const created = await prisma.mp3File.create({
      data: {
        userId: ownerId,
        name: f.name,
        sizeBytes: parseSizeBytes(f.size),
        durationSec: parseDurationSec(f.duration),
        storagePath: `seed/${ownerId}/${f.name}`,
        uploadedAt: new Date(f.uploaded),
      },
    });
    mp3IdByKey.set(`${f.projectId}:${f.name}`, created.id);
    mp3Count++;
  }
  console.log(`  ✓ ${mp3Count} mp3 files`);

  // ----- Schedules -----
  for (const s of SCHEDULES) {
    await prisma.schedule.create({
      data: {
        projectId: s.projectId,
        name: s.name,
        cron: CRON_BY_NAME[s.name] ?? '0 0 * * *',
        target: s.target,
        mp3FileId: mp3IdByKey.get(`${s.projectId}:${s.file}`) ?? null,
        enabled: s.enabled,
        skipHolidays: s.skipHolidays,
      },
    });
  }
  console.log(`  ✓ ${SCHEDULES.length} schedules`);

  // ----- Log entries -----
  for (const l of LOG_ENTRIES) {
    const userExists = l.userId !== 'system' && projectUsers.some(u => u.username === l.userId);
    await prisma.logEntry.create({
      data: {
        projectId: l.projectId,
        userId: userExists ? l.userId : null,
        userDisplayName: l.user,
        target: l.target,
        durationSec: parseDurationSec(l.duration),
        type: LOG_TYPE_MAP[l.type],
        recordingPath: l.recording ? `/data/projects/${l.projectId}/rec/${l.time.replace(/[: ]/g, '-')}.wav` : null,
        occurredAt: new Date(l.time.replace(' ', 'T')),
      },
    });
  }
  console.log(`  ✓ ${LOG_ENTRIES.length} log entries`);

  console.log('✅ Seed complete');
}

main()
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
