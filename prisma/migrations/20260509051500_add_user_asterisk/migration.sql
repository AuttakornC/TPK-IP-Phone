-- CreateTable
CREATE TABLE "user_asterisks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "asterisk_id" TEXT NOT NULL,
    "ext" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_asterisks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_asterisks_user_id_key" ON "user_asterisks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_asterisks_ext_key" ON "user_asterisks"("ext");

-- CreateIndex
CREATE INDEX "user_asterisks_asterisk_id_idx" ON "user_asterisks"("asterisk_id");

-- AddForeignKey
ALTER TABLE "user_asterisks" ADD CONSTRAINT "user_asterisks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_asterisks" ADD CONSTRAINT "user_asterisks_asterisk_id_fkey" FOREIGN KEY ("asterisk_id") REFERENCES "asterisks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: every existing project user needs a SIP credential. Auto-assign
-- ext starting from 9001 against the default Asterisk (`as1` from the previous
-- migration). Password is derived from the username — admin can rotate later.
INSERT INTO "user_asterisks" ("id", "user_id", "asterisk_id", "ext", "password", "created_at", "updated_at")
SELECT
    'ua_' || u."id",
    u."id",
    'as1',
    LPAD((9000 + ROW_NUMBER() OVER (ORDER BY u."created_at", u."id"))::TEXT, 4, '0'),
    'sip-' || u."username" || '-init',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
ON CONFLICT ("user_id") DO NOTHING;
