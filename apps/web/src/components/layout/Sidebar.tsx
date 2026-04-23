'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/dashboard/organization', label: 'Organizations', icon: '◎' },
  { href: '/servers', label: 'Servers', icon: '⬡' },
  { href: '/pipelines', label: 'Pipelines', icon: '⟩' },
  { href: '/deployments', label: 'Deployments', icon: '↑' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 h-screen w-64 bg-background border-r border-outline-variant/10 flex flex-col py-8 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      <div className="px-6 mb-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl border border-outline-variant/10 bg-surface-container-low p-3 transition-colors hover:border-primary/30"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">⬡</div>
          <div>
            <p className="font-headline text-sm font-bold uppercase tracking-wider text-on-surface">Devorbit</p>
            <p className="font-mono text-xs text-outline">v1.0.0</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 transition-colors duration-150 text-sm font-medium ${
                active
                  ? 'text-secondary bg-secondary/10 border-r-2 border-secondary shadow-[inset_-10px_0_20px_rgba(76,215,246,0.05)]'
                  : 'text-outline hover:text-on-surface hover:bg-white/5'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 pt-4 border-t border-outline-variant/10">
        <Link
          href="/deployments"
          className="block w-full rounded-xl bg-primary py-2.5 text-center text-xs font-bold uppercase tracking-widest text-on-primary font-headline shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all hover:shadow-[0_0_25px_rgba(208,188,255,0.5)]"
        >
          + New Deployment
        </Link>
      </div>

      <div className="px-6 mt-4 space-y-1">
        <a href="#" className="flex items-center py-2 text-xs text-outline hover:text-on-surface transition-colors">
          <span className="mr-2">?</span> Support
        </a>
        <a href="#" className="flex items-center py-2 text-xs text-outline hover:text-on-surface transition-colors">
          <span className="mr-2">&gt;_</span> Logs
        </a>
      </div>
    </aside>
  );
}
