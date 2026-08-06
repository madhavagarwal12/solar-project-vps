"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { createClient } from "@/lib/supabase/client";

const ITEMS = [
  { href: "/", icon: "dashboard", label: "Dashboard" },
  { href: "/leads", icon: "assignment", label: "Leads" },
  { href: "/notifications", icon: "notifications", label: "Alerts" },
  { href: "/documents", icon: "description", label: "Documents" },
];

export function Sidebar() {
  const pathname = usePathname();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="hidden md:flex h-full w-20 flex-col items-center bg-surface border-r border-outline-variant py-8 shrink-0">
      <div className="mb-12">
        <Icon name="solar_power" className="text-primary text-4xl" filled />
      </div>
      <nav className="flex flex-col gap-6 grow">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={
                active
                  ? "p-3 bg-secondary-container text-on-secondary-container font-semibold rounded-lg shadow-sm"
                  : "p-3 text-on-surface-variant hover:bg-surface-container-high transition-transform hover:translate-x-1 rounded-lg"
              }
            >
              <Icon name={item.icon} filled={active} />
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-6 items-center">
        <Link href="/profile" title="Settings" className="p-3 text-on-surface-variant hover:bg-surface-container-high transition-transform hover:translate-x-1 rounded-lg">
          <Icon name="settings" />
        </Link>
        <button
          type="button"
          title="Sign out"
          onClick={handleSignOut}
          className="p-3 text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-colors rounded-lg"
        >
          <Icon name="logout" />
        </button>
        <Link
          href="/profile"
          title="Profile"
          className="w-10 h-10 rounded-full border border-outline-variant bg-primary-container flex items-center justify-center text-on-primary-container"
        >
          <Icon name="person" />
        </Link>
      </div>
    </aside>
  );
}
