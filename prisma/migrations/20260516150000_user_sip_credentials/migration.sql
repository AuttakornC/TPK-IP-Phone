-- Fold SIP credentials onto the User model. Drop the now-unused
-- `user_asterisks` table (per-user-Asterisk binding) since every user inherits
-- the Asterisk from their project.

DROP TABLE IF EXISTS "user_asterisks";

ALTER TABLE "users" ADD COLUMN "sip_ext" TEXT;
ALTER TABLE "users" ADD COLUMN "sip_password" TEXT;

CREATE UNIQUE INDEX "users_sip_ext_key" ON "users"("sip_ext");
