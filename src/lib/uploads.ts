import 'server-only';
import path from 'node:path';

export const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');
export const MP3_DIR = path.join(UPLOADS_ROOT, 'mp3');

export const MAX_MP3_BYTES = 10 * 1024 * 1024;
export const MAX_MP3_PER_USER = 5;

export function mp3PathFor(userId: string, fileId: string): string {
  return path.join(MP3_DIR, userId, `${fileId}.mp3`);
}

export function mp3RelativePath(userId: string, fileId: string): string {
  return `${userId}/${fileId}.mp3`;
}
