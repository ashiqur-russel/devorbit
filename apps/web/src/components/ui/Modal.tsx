'use client';

import { useEffect } from 'react';

export function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
  maxWidthClassName = 'max-w-2xl',
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  maxWidthClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${maxWidthClassName} overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low shadow-[0_30px_80px_rgba(0,0,0,0.55)]`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
          <div className="absolute -left-20 -top-28 h-64 w-64 rounded-full bg-secondary/25 blur-3xl" />
          <div className="absolute -right-20 -bottom-28 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
        </div>

        <div className="relative border-b border-outline-variant/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Details</p>
              <h2 className="mt-1 truncate font-headline text-2xl font-black tracking-tighter text-on-surface">
                {title}
              </h2>
              {subtitle ? <p className="mt-2 text-xs text-on-surface-variant">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-outline-variant/15 bg-surface-container-highest px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-surface transition-colors hover:bg-surface-bright"
            >
              Close
            </button>
          </div>
        </div>

        <div className="relative max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <div className="relative border-t border-outline-variant/10 bg-surface-container-lowest px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

