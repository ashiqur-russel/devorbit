export default function TopBar() {
  return (
    <header className="fixed top-0 left-64 right-0 z-50 flex justify-between items-center h-16 px-6 bg-background/40 backdrop-blur-xl border-b border-outline-variant/10">
      <div className="flex items-center bg-surface-container-lowest px-4 py-1.5 rounded-xl border border-outline-variant/15 gap-2">
        <span className="text-secondary text-sm">⌕</span>
        <input
          type="text"
          placeholder="Search systems..."
          className="bg-transparent border-none focus:ring-0 text-xs text-on-surface-variant w-48 outline-none"
        />
      </div>
      <div className="flex items-center gap-4 text-outline">
        <button className="hover:text-on-surface transition-colors p-2 rounded-lg hover:bg-white/5">🔔</button>
        <button className="hover:text-on-surface transition-colors p-2 rounded-lg hover:bg-white/5">⚙</button>
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-xs text-primary font-bold">
          A
        </div>
      </div>
    </header>
  );
}
