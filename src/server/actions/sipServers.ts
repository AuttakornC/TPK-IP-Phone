"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";

export interface SipServerRow {
  id: string;
  name: string;
  domain: string;
  port: number;
  active: boolean;
  projectCount: number;
}

export async function listSipServers(): Promise<SipServerRow[]> {
  await requireAdmin();
  const rows = await prisma.sipServer.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { projects: true } },
    },
  });
  return rows.map((a) => ({
    id: a.id,
    name: a.name,
    domain: a.domain,
    port: a.port,
    active: a.active,
    projectCount: a._count.projects,
  }));
}

// Minimal list for use inside project create/edit forms.
export async function listSipServersForSelect(): Promise<
  Array<{ id: string; name: string; domain: string; active: boolean }>
> {
  await requireAdmin();
  const rows = await prisma.sipServer.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, domain: true, active: true },
  });
  return rows;
}

export type SaveSipServerResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error:
        | "name_required"
        | "domain_required"
        | "domain_taken"
        | "port_invalid";
    };

export async function createSipServer(input: {
  name: string;
  domain: string;
  port: number;
  active: boolean;
}): Promise<SaveSipServerResult> {
  await requireAdmin();
  const name = input.name.trim();
  const domain = input.domain.trim().toLowerCase();
  const port = Math.trunc(input.port);
  if (!name) return { ok: false, error: "name_required" };
  if (!domain) return { ok: false, error: "domain_required" };
  if (!Number.isFinite(port) || port < 1 || port > 65535)
    return { ok: false, error: "port_invalid" };

  const dup = await prisma.sipServer.findUnique({ where: { domain } });
  if (dup) return { ok: false, error: "domain_taken" };

  const created = await prisma.sipServer.create({
    data: { name, domain, port, active: input.active },
  });

  revalidatePath("/[locale]/admin/sip-servers", "page");
  return { ok: true, id: created.id };
}

export async function updateSipServer(input: {
  id: string;
  name: string;
  domain: string;
  port: number;
  active: boolean;
}): Promise<SaveSipServerResult> {
  await requireAdmin();
  const name = input.name.trim();
  const domain = input.domain.trim().toLowerCase();
  const port = Math.trunc(input.port);
  if (!name) return { ok: false, error: "name_required" };
  if (!domain) return { ok: false, error: "domain_required" };
  if (!Number.isFinite(port) || port < 1 || port > 65535)
    return { ok: false, error: "port_invalid" };

  const dup = await prisma.sipServer.findFirst({
    where: { domain, NOT: { id: input.id } },
    select: { id: true },
  });
  if (dup) return { ok: false, error: "domain_taken" };

  await prisma.sipServer.update({
    where: { id: input.id },
    data: { name, domain, port, active: input.active },
  });

  revalidatePath("/[locale]/admin/sip-servers", "page");
  return { ok: true, id: input.id };
}

export type DeleteSipServerResult =
  | { ok: true }
  | { ok: false; error: "in_use"; projectCount: number };

export async function deleteSipServer(
  id: string,
): Promise<DeleteSipServerResult> {
  await requireAdmin();
  const counts = await prisma.sipServer.findUnique({
    where: { id },
    include: {
      _count: { select: { projects: true } },
    },
  });
  if (!counts) return { ok: true };

  const projects = counts._count.projects;
  if (projects > 0) {
    return { ok: false, error: "in_use", projectCount: projects };
  }

  await prisma.sipServer.delete({ where: { id } });
  revalidatePath("/[locale]/admin/sip-servers", "page");
  return { ok: true };
}
