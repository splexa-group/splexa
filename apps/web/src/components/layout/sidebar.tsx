"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  User,
  CalendarDays,
  File,
  Settings,
  LogOut,
  HelpCircle,
  CalendarPlus,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/services/auth";

const TOP_NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Cases", href: "/cases", icon: FileText },
  { label: "Clients", href: "/clients", icon: User },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Documents", href: "/documents", icon: File },
  { label: "Settings", href: "/settings", icon: Settings },
];

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("nav-item", active && "nav-item-active")}
    >
      <Icon icon={icon} size="sm" />
      <span className="hidden lg:block truncate">{label}</span>
      <Icon
        icon={ChevronRight}
        size="sm"
        className={cn(
          "hidden lg:block ml-auto shrink-0",
          active ? "text-white" : "text-white/30"
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
      <div className="flex items-center gap-3 px-3 py-3 shrink-0">
        <div className="w-8 h-8 rounded-md bg-brand-light/20 flex items-center justify-center text-brand-light text-[13px] font-bold shrink-0">
          {initial}
        </div>
        <div className="hidden lg:flex flex-col min-w-0">
          <span className="text-[13px] font-semibold text-white truncate leading-tight">
            {displayName}
          </span>
          <span className="text-[11px] text-white/40 truncate leading-tight">
            {user?.email}
          </span>
        </div>
      </div>

      <div className="h-px bg-white/15 shrink-0" />

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-2 pt-3 flex-1 overflow-y-auto">
        {TOP_NAV.map(({ href, icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            active={pathname === href || pathname.startsWith(href + "/")}
          />
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="flex items-center justify-around px-3 pb-4 pt-2">
        <button
          type="button"
          title="Support"
          onClick={() => window.open("mailto:support@splexa.com")}
          className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          <Icon icon={HelpCircle} size="sm" />
        </button>
        <button
          type="button"
          title="Book a demo"
          className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          <Icon icon={CalendarPlus} size="sm" />
        </button>
        <button
          type="button"
          title="Log out"
          onClick={handleLogout}
          className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          <Icon icon={LogOut} size="sm" />
        </button>
        <span
          title="Splexa"
          className="p-2 text-white/20 select-none"
        >
          ⚖
        </span>
      </div>
    </aside>
  );
}
