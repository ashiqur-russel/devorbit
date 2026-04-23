'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopBar() {
  const pathname = usePathname();
  const hideSearch = pathname?.startsWith('/settings');

  return (
    <header className="fixed left-64 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-outline-variant/10 bg-background/40 px-6 backdrop-blur-xl">
      {hideSearch ? (
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Settings</span>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-1.5">
          <span className="text-sm text-secondary">⌕</span>
          <input
            type="search"
            placeholder="Search systems…"
            className="w-48 border-none bg-transparent text-xs text-on-surface-variant outline-none focus:ring-0"
          />
        </div>
      )}
      <div className="flex items-center gap-4 text-outline">
        <button
          type="button"
          className="rounded-lg p-2 transition-colors hover:bg-white/5 hover:text-on-surface"
          aria-label="Notifications"
        >
          🔔
        </button>
        <Link
          href="/settings/integrations"
          className="rounded-lg p-2 transition-colors hover:bg-white/5 hover:text-on-surface"
          aria-label="Settings"
        >
          ⚙
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/20 text-xs font-bold text-primary">
          A
        </div>
      </div>
    </header>
  );
}
