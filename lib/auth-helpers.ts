import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

/** Server-only: get the current session, redirecting to /login if absent. */
export async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: authUser.email.toLowerCase() },
  });

  if (!user || !user.active) redirect("/login");

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      authUserId: authUser.id,
    },
  };
}

/** Server-only: get the current session and assert the caller holds one of `roles`. */
export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) redirect("/");
  return session;
}

export async function logAudit(action: string, actorId?: string, detail?: string) {
  await prisma.auditLog.create({ data: { action, actorId, detail } });
}
