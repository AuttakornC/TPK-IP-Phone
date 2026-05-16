import { promises as fs } from 'node:fs';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { mp3PathFor } from '@/lib/uploads';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const username = session?.user?.username ?? null;
  if (!username) {
    return new NextResponse('unauthorized', { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!me) return new NextResponse('unauthorized', { status: 401 });

  const { id } = await params;
  const row = await prisma.mp3File.findFirst({
    where: { id, userId: me.id },
    select: { id: true, userId: true, name: true },
  });
  if (!row) return new NextResponse('not found', { status: 404 });

  let data: Buffer;
  try {
    data = await fs.readFile(mp3PathFor(row.userId, row.id));
  } catch {
    return new NextResponse('file missing', { status: 410 });
  }

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(data.length),
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `inline; filename="${encodeURIComponent(row.name)}.mp3"`,
    },
  });
}
