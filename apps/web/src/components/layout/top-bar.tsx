'use client';

import { useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { TopBarContext } from './top-bar-context';
import { ROUTE_CONFIG } from './top-bar-config';

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const ctx = useContext(TopBarContext);

  const segments = pathname.split('/').filter(Boolean);
  const rootPath = '/' + (segments[0] ?? '');
  const isChild = segments.length > 1;

  const config = ROUTE_CONFIG[rootPath];
  const sectionTitle = config?.title ?? segments[0] ?? '';
  const resourceTitle = ctx?.resourceTitle ?? null;

  const displayTitle = isChild && resourceTitle
    ? `${sectionTitle} / ${resourceTitle}`
    : sectionTitle;

  return (
    <header className="h-[52px] bg-card border-b border-line flex items-center px-4 gap-3 shrink-0 z-30">
      <button
        type="button"
        disabled={!isChild}
        onClick={() => isChild && router.back()}
        aria-label="Go back"
        className={cn(
          'w-[30px] h-[30px] flex items-center justify-center rounded-lg transition-colors shrink-0',
          isChild
            ? 'bg-subtle text-label hover:bg-line cursor-pointer'
            : 'text-placeholder opacity-40 cursor-default'
        )}
      >
        <Icon icon={ChevronLeft} size="sm" />
      </button>

      <h1 className="text-[15px] font-semibold text-dark flex-1 truncate">
        {displayTitle}
      </h1>

      {config?.action && (
        <Link
          href={config.action.href}
          className="flex items-center gap-1.5 px-3 h-[30px] bg-brand text-white text-[12px] font-medium rounded-lg hover:bg-brand-dark transition-colors shrink-0"
        >
          <Icon icon={Plus} size="xs" />
          {config.action.label}
        </Link>
      )}
    </header>
  );
}
