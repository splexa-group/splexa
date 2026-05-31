'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { NAV_ITEMS } from './sidebar/nav-items';

const TABS = NAV_ITEMS
  .filter((item) => item.href !== '/settings')
  .map((item) => ({ ...item, label: item.shortLabel ?? item.label }));

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
