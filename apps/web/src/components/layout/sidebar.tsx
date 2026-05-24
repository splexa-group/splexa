"use client";

import { useState, useRef, useEffect } from "react";
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
  MoreVertical,
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
    <Link href={href} className={cn("nav-item", active && "nav-item--active")}>
      <Icon icon={icon} size="sm" />
      <span className="hidden lg:block truncate">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const displayName = user
    ? (user.orgName ?? `${user.firstName} Advocates`)
    : "";
  const initial = displayName.charAt(0).toUpperCase();

  const avatarInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  async function handleLogout() {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      router.push("/login");
    }
  }

  return (
    <aside className="hidden md:flex flex-col md:w-14 lg:w-[220px] bg-surface-dark shrink-0 h-screen overflow-hidden">
      {/* Header - org name */}
      <div className="h-[52px] flex items-center px-4 border-b border-white/[0.07] shrink-0">
        <span className="hidden lg:block text-[15px] font-semibold text-white truncate">
          {displayName}
        </span>
        <span className="lg:hidden text-[15px] font-semibold text-brand-light mx-auto">
          {initial}
        </span>
      </div>

      {/* Top nav group */}
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

      {/* Bottom nav group + user */}
      <div className="px-2 pb-2 flex flex-col gap-1">

        {/* User section */}
        <div className="relative mt-1" ref={popoverRef}>
          {/* Popover */}
          {popoverOpen && (
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-card border border-line rounded-lg shadow-lg p-3 z-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                  {avatarInitials}
                </div>
                <div className="min-w-0 hidden lg:block">
                  <p className="text-[12px] font-medium text-dark truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-secondary truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[12px] text-negative hover:bg-negative-muted transition-colors"
              >
                <Icon icon={LogOut} size="xs" />
                Log out
              </button>
            </div>
          )}

          {/* User row trigger */}
          <button
            type="button"
            onClick={() => setPopoverOpen((v) => !v)}
            className="flex items-center gap-2 w-full rounded-lg px-2 py-2 hover:bg-white/5 transition-colors border-t border-white/[0.07] mt-1"
          >
            <div className="w-[30px] h-[30px] rounded-full bg-brand flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
              {avatarInitials}
            </div>
            <div className="hidden lg:flex flex-col items-start min-w-0 flex-1">
              <span className="text-[12px] font-medium text-white truncate w-full text-left">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] text-white/40 truncate w-full text-left">
                {user?.email}
              </span>
            </div>
            <Icon
              icon={MoreVertical}
              size="xs"
              className="hidden lg:block text-white/30 shrink-0"
            />
          </button>
        </div>
      </div>
    </aside>
  );
}
