"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const TABS = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/leads", icon: "assignment", label: "Leads" },
  { href: "/documents", icon: "description", label: "Docs" },
  { href: "/notifications", icon: "notifications", label: "Alerts" },
  { href: "/profile", icon: "person", label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-border-subtle flex justify-around items-center px-2 py-2 shadow-lg md:hidden">
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              active
                ? "flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-5 py-1"
                : "flex flex-col items-center justify-center text-on-surface-variant transition-colors hover:text-primary"
            }
          >
            <Icon name={tab.icon} filled={active} />
            <span className="text-body-sm mt-1">{tab.label}</span>
          </Link>
        );
      })}
    </footer>
  );
}
