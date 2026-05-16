-- Repoint Mp3File from project ownership to user ownership.
-- mp3_files held only mock/seed data, so it's safe to drop existing rows.

DELETE FROM "mp3_files";

ALTER TABLE "mp3_files" DROP CONSTRAINT "mp3_files_project_id_fkey";
DROP INDEX "mp3_files_project_id_idx";

ALTER TABLE "mp3_files" DROP COLUMN "project_id";
ALTER TABLE "mp3_files" ADD COLUMN "user_id" TEXT NOT NULL;

ALTER TABLE "mp3_files" ADD CONSTRAINT "mp3_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "mp3_files_user_id_idx" ON "mp3_files"("user_id");
