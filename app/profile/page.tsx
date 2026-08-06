import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireSession();
  const { user } = session;

  const lastLogin = await prisma.auditLog.findFirst({
    where: { actorId: user.id, action: "LOGIN_SUCCESS" },
    orderBy: { createdAt: "desc" },
  });

  const isManagerOrAdmin = user.role === "MANAGER" || user.role === "ADMIN";
  const team = isManagerOrAdmin
    ? await prisma.user.findMany({ orderBy: { name: "asc" } })
    : [];

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 p-gutter-mobile md:p-gutter-desktop pb-24 md:pb-8 max-w-2xl mx-auto w-full space-y-6">
        <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-primary">
          Profile
        </h1>

        <div className="bg-white border border-border-subtle rounded-xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
            <Icon name="person" className="text-3xl" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-body-base truncate">{user.name}</div>
            <div className="text-body-sm text-on-surface-variant truncate">{user.email}</div>
            <span className="inline-block mt-1 font-label text-data-label uppercase text-on-secondary-container bg-secondary-container rounded-full px-2 py-0.5">
              {ROLE_LABELS[user.role as Role]}
            </span>
          </div>
        </div>

        <div className="bg-white border border-border-subtle rounded-xl p-6">
          <p className="font-label text-data-label text-outline uppercase mb-1">Last sign-in</p>
          <p className="text-body-base">
            {lastLogin ? lastLogin.createdAt.toLocaleString() : "No sign-in history yet."}
          </p>
        </div>

        {isManagerOrAdmin && (
          <div className="bg-white border border-border-subtle rounded-xl p-6">
            <p className="font-label text-data-label text-outline uppercase mb-3 flex items-center gap-2">
              <Icon name="group" className="text-[16px]" />
              Team ({ROLE_LABELS[user.role as Role]} view)
            </p>
            <ul className="divide-y divide-border-subtle">
              {team.map((member) => (
                <li key={member.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-body-base font-medium truncate">{member.name}</div>
                    <div className="text-body-sm text-on-surface-variant truncate">{member.email}</div>
                  </div>
                  <span className="font-label text-data-label uppercase text-outline shrink-0">
                    {ROLE_LABELS[member.role as Role]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <SignOutButton />
      </main>
      <BottomNav />
    </div>
  );
}
