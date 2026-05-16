"use server";

import { prisma } from "@/lib/prisma";
import { requireGeneralUser } from "@/server/auth";
import type { SipConfig } from "@/lib/sip";

export type SipConfigResult =
  | { ok: true; config: SipConfig }
  | { ok: false; error: "no_credentials" | "sip_server_inactive" };

/**
 * Builds the SIP config for the signed-in general user from `User.sipExt` /
 * `User.sipPassword` + their project's `SipServer`. The plaintext password is
 * intentionally returned — admin-managed and used directly by the user's
 * browser to register (see CLAUDE.md).
 */
export async function getSipConfig(): Promise<SipConfigResult> {
  const session = await requireGeneralUser();
  const username = session?.user?.username ?? "";
  if (!username) return { ok: false, error: "no_credentials" };

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      project: { include: { sipServer: true } },
    },
  });
  if (!user?.sipExt || !user.sipPassword) {
    return { ok: false, error: "no_credentials" };
  }
  if (!user.project?.sipServer) return { ok: false, error: "no_credentials" };
  if (!user.project.sipServer.active)
    return { ok: false, error: "sip_server_inactive" };

  const domain = user.project.sipServer.domain;
  const port = user.project.sipServer.port;
  return {
    ok: true,
    config: {
      wssUrl: `wss://${domain}:${port}/ws`,
      uri: `sip:${user.sipExt}@${domain}`,
      password: user.sipPassword,
      realm: domain,
    },
  };
}
