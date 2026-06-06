"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, HelpCircle, CalendarPlus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/services/auth";
import { NAV_ITEMS, type NavItem } from "./nav-items";

function NavLink({ href, icon, label, active }: NavItem & { active: boolean }) {
  return (
    <Link href={href} className={cn("nav-item", active && "nav-item-active")}>
      <Icon icon={icon} size="sm" />
      <span className="hidden lg:block truncate">{label}</span>
      <Icon
        icon={ChevronRight}
        size="sm"
        className={cn(
          "hidden lg:block ml-auto shrink-0",
          active ? "text-white" : "text-white/30",
        )}
      />
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const displayName = user
    ? (user.orgName ?? `${user.firstName} ${user.lastName}`)
    : "";
  const initial = displayName.charAt(0).toUpperCase();

  async function handleLogout() {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      router.push("/login");
    }
  }

  return (
    <aside className="hidden md:flex flex-col md:w-16 lg:w-[250px] bg-surface-dark shrink-0 h-screen overflow-hidden">
      {/* Header — identity */}
      <div className="flex items-center gap-3 px-3 py-5 shrink-0">
        <div className="w-8 h-8 rounded bg-brand-soft flex items-center justify-center text-brand text-[14.5px] font-bold shrink-0">
          {initial}
        </div>
        <div className="hidden lg:flex flex-col min-w-0">
          <span className="text-sm font-semibold text-white truncate leading-tight">
            {displayName}
          </span>
          <span className="text-[11px] text-white/40 truncate leading-tight mt-0.5">
            {user?.email}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-2 pt-3 flex-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon, label }) => (
          <NavLink
            key={href}
            href={href}
            icon={icon}
            label={label}
            active={pathname === href || pathname.startsWith(href + "/")}
          />
        ))}
      </nav>

      <div className="h-px bg-white/20 shrink-0" />

      {/* Bottom actions */}
      <div className="flex items-center justify-between px-3 pb-4 pt-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Log out"
            onClick={handleLogout}
            className="p-2 rounded text-white hover:text-white/90 hover:bg-brand-soft/20 transition-colors"
          >
            <Icon icon={LogOut} size="md" />
          </button>
          <button
            type="button"
            title="Support"
            onClick={() => window.open("mailto:support@splexa.in")}
            className="p-2 rounded text-white hover:text-white/90 hover:bg-brand-soft/20 transition-colors"
          >
            <Icon icon={HelpCircle} size="md" />
          </button>
          <button
            type="button"
            title="Book a demo"
            className="p-2 rounded text-white hover:text-white/90 hover:bg-brand-soft/20 transition-colors"
          >
            <Icon icon={CalendarPlus} size="md" />
          </button>
        </div>
        <Image src="/white-dark.svg" alt="Splexa" width={22} height={22} />
      </div>
    </aside>
  );
}
