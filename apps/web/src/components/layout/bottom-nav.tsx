'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FileText,
  User,
  CalendarDays,
  File,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';

const TABS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Cases',     href: '/cases',     icon: FileText },
  { label: 'Clients',   href: '/clients',   icon: User },
  { label: 'Calendar',  href: '/calendar',  icon: CalendarDays },
  { label: 'Docs',      href: '/documents', icon: File },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[58px] bg-card border-t border-line flex items-center z-40">
      {TABS.map(({ label, href, icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn('bottom-tab', active && 'bottom-tab-active')}
          >
            <Icon icon={icon} size="md" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
