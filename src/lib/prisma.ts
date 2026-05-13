import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

function build(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Reuse a single Prisma client across hot reloads in dev so we don't exhaust
// connections. In prod each instance gets its own.
export const prisma = global.__prisma ?? build();

if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;
