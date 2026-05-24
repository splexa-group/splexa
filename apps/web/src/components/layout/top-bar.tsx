'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Search } from 'lucide-react';
import { useTopBar } from './top-bar-context';
import { Icon } from '@/components/ui/icon';

export function TopBar() {
  const { config } = useTopBar();
  const router = useRouter();

  return (
    <header className="h-[58px] bg-card border-b border-line flex items-center px-5 gap-3 shrink-0 z-30">
      {!config || config.variant === 'default' ? (
        <>
          <h1 className="text-[15px] font-semibold text-dark flex-1 truncate">
            {config?.title ?? ''}
          </h1>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-subtle text-[12px] text-placeholder cursor-default"
            tabIndex={-1}
            aria-label="Search"
          >
            <Icon icon={Search} size="xs" />
            <span className="hidden sm:inline">Search cases, clients…</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-[30px] h-[30px] flex items-center justify-center rounded-lg bg-subtle text-label hover:bg-line transition-colors shrink-0"
            aria-label="Go back"
          >
            <Icon icon={ChevronLeft} size="sm" />
          </button>
          <h1 className="text-[15px] font-semibold text-dark truncate">
            {config.title}
          </h1>
          {config.typeTag && (
            <span className="text-xs text-placeholder shrink-0">· {config.typeTag}</span>
          )}
        </>
      )}
    </header>
  );
}
