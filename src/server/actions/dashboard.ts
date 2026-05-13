'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/server/auth';
import type { ProjectStatus as MockProjectStatus } from '@/lib/mock';

const STATUS_FROM_DB = {
  ACTIVE: 'active',
  EXPIRING: 'expiring',
  EXPIRED: 'expired',
} as const satisfies Record<'ACTIVE' | 'EXPIRING' | 'EXPIRED', MockProjectStatus>;

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  expiringProjects: number;
  totalUsers: number;
  headVillages: number;
  totalSpeakers: number;
  onlineSpeakers: number;
  recentProjects: {
    id: string;
    name: string;
    status: MockProjectStatus;
    userCount: number;
    speakerCount: number;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin();
  const [
    totalProjects,
    activeProjects,
    expiringProjects,
    totalUsers,
    headVillages,
    totalSpeakers,
    onlineSpeakers,
    recent,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: 'ACTIVE' } }),
    prisma.project.count({ where: { status: 'EXPIRING' } }),
    prisma.user.count(),
    prisma.user.count({ where: { role: 'HEAD_VILLAGE' } }),
    prisma.speaker.count(),
    prisma.speaker.count({ where: { online: true } }),
    prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: { select: { users: true, speakers: true } },
      },
    }),
  ]);

  return {
    totalProjects,
    activeProjects,
    expiringProjects,
    totalUsers,
    headVillages,
    totalSpeakers,
    onlineSpeakers,
    recentProjects: recent.map(p => ({
      id: p.id,
      name: p.name,
      status: STATUS_FROM_DB[p.status],
      userCount: p._count.users,
      speakerCount: p._count.speakers,
    })),
  };
}
