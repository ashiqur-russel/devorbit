import Link from 'next/link';

export default function LoginPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col overflow-hidden">
      {/* Ambient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(208,188,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(208,188,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />

      {/* Login card */}
      <main className="flex-grow flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md relative group">
          {/* Ghost border glow */}
          <div className="absolute -inset-px bg-gradient-to-br from-primary/30 via-transparent to-secondary/30 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition duration-500" />

          <div className="relative bg-surface-container-low/80 backdrop-blur-2xl rounded-xl p-8 md:p-12 border border-outline-variant/10 shadow-2xl flex flex-col items-center">
            {/* Brand */}
            <div className="mb-10 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-3xl font-black tracking-tighter text-primary italic font-headline">
                  DevOrbit
                </span>
              </div>
              <p className="text-on-surface-variant text-xs tracking-widest uppercase font-medium">
                Core Engine Access
              </p>
            </div>

            <div className="w-full space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight font-headline">
                  Welcome to the Control Center
                </h2>
                <p className="text-on-surface-variant/70 text-sm">
                  Monitor your entire stack in one place.
                </p>
              </div>

              {/* GitHub OAuth */}
              <a
                href={`${apiUrl}/api/v1/auth/github`}
                className="w-full group/btn relative flex items-center justify-center gap-4 bg-surface-container-highest hover:bg-surface-bright text-on-surface py-4 px-6 rounded-xl transition-all duration-200 active:scale-95"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12" />
                </svg>
                <span className="font-semibold text-base tracking-tight">Continue with GitHub</span>
              </a>

              <div className="flex flex-col items-center gap-3 pt-4 border-t border-outline-variant/10">
                <div className="flex items-center gap-6 text-xs text-on-surface-variant uppercase tracking-widest font-bold">
                  <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                  <span className="w-1 h-1 bg-outline-variant rounded-full" />
                  <a href="#" className="hover:text-primary transition-colors">Docs</a>
                  <span className="w-1 h-1 bg-outline-variant rounded-full" />
                  <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 flex justify-between items-center text-xs uppercase tracking-widest text-on-surface-variant/40">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
          </span>
          <span>All systems operational</span>
        </div>
        <span>© 2025 DevOrbit</span>
      </footer>
    </div>
  );
}
