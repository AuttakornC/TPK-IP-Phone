-- Rename `asterisks` → `sip_servers` and `projects.asterisk_id` → `projects.sip_server_id`.
-- Pure rename — no data changes; old/new names are 1:1.

ALTER TABLE "asterisks" RENAME TO "sip_servers";

ALTER TABLE "projects" RENAME COLUMN "asterisk_id" TO "sip_server_id";

ALTER INDEX "projects_asterisk_id_idx" RENAME TO "projects_sip_server_id_idx";

ALTER TABLE "projects" RENAME CONSTRAINT "projects_asterisk_id_fkey" TO "projects_sip_server_id_fkey";
ALTER TABLE "sip_servers" RENAME CONSTRAINT "asterisks_pkey" TO "sip_servers_pkey";
ALTER INDEX "asterisks_domain_key" RENAME TO "sip_servers_domain_key";
