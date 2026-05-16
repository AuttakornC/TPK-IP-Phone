-- Move asterisk ownership from per-speaker / per-user-credential to per-project.
-- Backfills project.asterisk_id from the project's first speaker before dropping
-- the old speaker.asterisk_id and user_asterisks.asterisk_id columns.

-- 1. Add new columns to projects (nullable for backfill, then NOT NULL).
ALTER TABLE "projects" ADD COLUMN "asterisk_id" TEXT;
ALTER TABLE "projects" ADD COLUMN "broadcast_prefix" TEXT NOT NULL DEFAULT '';

-- 2. Backfill: pick any one speaker per project as the source of truth.
UPDATE "projects" p
SET "asterisk_id" = (
  SELECT s."asterisk_id" FROM "speakers" s WHERE s."project_id" = p."id" LIMIT 1
);

-- 3. Any project with no speakers: fall back to the first user_asterisk row
--    for one of that project's users.
UPDATE "projects" p
SET "asterisk_id" = (
  SELECT ua."asterisk_id"
  FROM "user_asterisks" ua
  JOIN "users" u ON u."id" = ua."user_id"
  WHERE u."project_id" = p."id"
  LIMIT 1
)
WHERE p."asterisk_id" IS NULL;

-- 4. Last-resort fallback: first asterisk in the table (so the NOT NULL
--    constraint doesn't fail on empty/skeleton projects).
UPDATE "projects" SET "asterisk_id" = (SELECT "id" FROM "asterisks" ORDER BY "created_at" ASC LIMIT 1)
WHERE "asterisk_id" IS NULL;

-- 5. Enforce NOT NULL + FK + index on projects.asterisk_id.
ALTER TABLE "projects" ALTER COLUMN "asterisk_id" SET NOT NULL;
ALTER TABLE "projects" ADD CONSTRAINT "projects_asterisk_id_fkey" FOREIGN KEY ("asterisk_id") REFERENCES "asterisks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "projects_asterisk_id_idx" ON "projects"("asterisk_id");

-- 6. Drop the per-speaker asterisk link.
ALTER TABLE "speakers" DROP CONSTRAINT "speakers_asterisk_id_fkey";
DROP INDEX "speakers_asterisk_id_idx";
ALTER TABLE "speakers" DROP COLUMN "asterisk_id";

-- 7. Drop the per-user-credential asterisk link.
ALTER TABLE "user_asterisks" DROP CONSTRAINT "user_asterisks_asterisk_id_fkey";
DROP INDEX "user_asterisks_asterisk_id_idx";
ALTER TABLE "user_asterisks" DROP COLUMN "asterisk_id";
