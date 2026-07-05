import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FileText,
  User,
  CalendarDays,
  File,
  Settings,
} from 'lucide-react';

export interface NavItem {
  label: string;
  shortLabel?: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Cases', href: '/cases', icon: FileText },
  // { label: 'Clients', href: '/clients', icon: User },
  { label: 'Calendar', href: '/calendar', icon: CalendarDays },
  { label: 'Documents', shortLabel: 'Docs', href: '/documents', icon: File },
  { label: 'Settings', href: '/settings', icon: Settings },
];
