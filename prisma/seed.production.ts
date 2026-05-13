import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.env.SUPERADMIN_USERNAME?.trim() || 'superadmin';
  const name = process.env.SUPERADMIN_NAME?.trim() || 'Super Admin';
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!password) {
    console.error('❌ SUPERADMIN_PASSWORD is required for production seed.');
    process.exit(1);
  }

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    console.log(`✓ Superadmin "${username}" already exists — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.create({
    data: { name, username, passwordHash, active: true },
  });
  console.log(`✅ Superadmin "${username}" created.`);
}

main()
  .catch(err => {
    console.error('❌ Production seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
