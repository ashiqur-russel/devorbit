'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
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
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/10">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">⬡</div>
          <div>
            <p className="text-sm font-bold text-on-surface font-headline uppercase tracking-wider">Core Engine</p>
            <p className="text-xs text-outline font-mono">v1.0.0</p>
          </div>
        </div>
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
        <button className="w-full py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold font-headline uppercase tracking-widest shadow-[0_0_15px_rgba(208,188,255,0.3)] hover:shadow-[0_0_25px_rgba(208,188,255,0.5)] transition-all">
          + New Deployment
        </button>
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
