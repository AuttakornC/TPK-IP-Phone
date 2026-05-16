'use server';

import { prisma } from '@/lib/prisma';
import { requireGeneralUser } from '@/server/auth';

export interface GeneralSpeakerRow {
  id: string;
  name: string;
  ext: string;
  area: string;
  online: boolean;
}

export interface GeneralHomeData {
  user: { id: string; username: string; name: string };
  project: { id: string; name: string } | null;
  speakers: GeneralSpeakerRow[];
}

export async function getGeneralHomeData(): Promise<GeneralHomeData> {
  const session = await requireGeneralUser();
  const sessionUser = session?.user;
  const username = sessionUser?.username ?? '';

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      project: true,
      assignedSpeakers: {
        include: { speaker: true },
        orderBy: { speaker: { ext: 'asc' } },
      },
    },
  });
  if (!user) {
    return {
      user: { id: '', username, name: sessionUser?.name ?? username },
      project: null,
      speakers: [],
    };
  }

  return {
    user: { id: user.id, username: user.username, name: user.name },
    project: user.project ? { id: user.project.id, name: user.project.name } : null,
    speakers: user.assignedSpeakers.map(a => ({
      id: a.speaker.id,
      name: a.speaker.name,
      ext: a.speaker.ext,
      area: a.speaker.area,
      online: a.speaker.online,
    })),
  };
}

export interface GeneralHistoryRow {
  id: string;
  type: 'emergency' | 'group' | 'single' | 'scheduled' | 'mp3';
  target: string;
  durationSec: number;
  occurredAt: string;
  hasRecording: boolean;
}

const TYPE_FROM_DB = {
  EMERGENCY: 'emergency',
  GROUP: 'group',
  SINGLE: 'single',
  SCHEDULED: 'scheduled',
  MP3: 'mp3',
} as const;

export async function listMyBroadcastHistory(): Promise<GeneralHistoryRow[]> {
  const session = await requireGeneralUser();
  const username = session?.user?.username ?? '';
  if (!username) return [];

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) return [];

  const rows = await prisma.logEntry.findMany({
    where: { userId: user.id },
    orderBy: { occurredAt: 'desc' },
    take: 100,
  });

  return rows.map(r => ({
    id: r.id,
    type: TYPE_FROM_DB[r.type],
    target: r.target,
    durationSec: r.durationSec,
    occurredAt: r.occurredAt.toISOString(),
    hasRecording: r.recordingPath !== null,
  }));
}
