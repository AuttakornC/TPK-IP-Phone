-- CreateTable
CREATE TABLE "asterisks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asterisks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asterisks_domain_key" ON "asterisks"("domain");

-- Backfill: insert a default Asterisk so existing speakers can reference it.
INSERT INTO "asterisks" ("id", "name", "domain", "active", "created_at", "updated_at")
VALUES ('as1', 'Asterisk หลัก', 'sip.tpk-pa.local', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- AlterTable: add asterisk_id with default so existing rows backfill cleanly,
-- then drop the default so future inserts must specify it explicitly.
ALTER TABLE "speakers" ADD COLUMN "asterisk_id" TEXT NOT NULL DEFAULT 'as1';
ALTER TABLE "speakers" ALTER COLUMN "asterisk_id" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "speakers_asterisk_id_idx" ON "speakers"("asterisk_id");

-- AddForeignKey
ALTER TABLE "speakers" ADD CONSTRAINT "speakers_asterisk_id_fkey" FOREIGN KEY ("asterisk_id") REFERENCES "asterisks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
