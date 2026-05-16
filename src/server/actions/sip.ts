"use server";

import { prisma } from "@/lib/prisma";
import { requireGeneralUser } from "@/server/auth";
import type { SipConfig } from "@/lib/sip";

export type SipConfigResult =
  | { ok: true; config: SipConfig }
  | { ok: false; error: "no_credentials" | "asterisk_inactive" };

/**
 * Builds the SIP config for the signed-in general user from their `UserAsterisk`
 * row + linked `Asterisk`. The plaintext password is intentionally returned —
 * see CLAUDE.md note on `UserAsterisk.password` being admin-managed and used
 * directly by the user's browser to register with Asterisk.
 */
export async function getSipConfig(): Promise<SipConfigResult> {
  const session = await requireGeneralUser();
  const username = session?.user?.username ?? "";
  if (!username) return { ok: false, error: "no_credentials" };

  const user = await prisma.user.findUnique({
    where: { username },
    include: { asterisk: { include: { asterisk: true } } },
  });
  if (!user?.asterisk) return { ok: false, error: "no_credentials" };
  if (!user.asterisk.asterisk.active)
    return { ok: false, error: "asterisk_inactive" };

  const domain = user.asterisk.asterisk.domain;
  const port = user.asterisk.asterisk.port;
  return {
    ok: true,
    config: {
      wssUrl: `wss://${domain}:${port}/ws`,
      uri: `sip:${user.asterisk.ext}@${domain}`,
      password: user.asterisk.password,
      realm: domain,
    },
  };
}
