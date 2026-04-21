import Link from 'next/link';

export default function ServersPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter font-headline text-on-surface">Servers</h1>
          <p className="text-on-surface-variant text-sm mt-1">Connected nodes and health status</p>
        </div>
        <Link href="/settings/agent" className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold font-headline uppercase tracking-widest hover:shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all">
          + Add Server
        </Link>
      </div>

      <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-4 text-2xl">⬡</div>
        <h3 className="font-headline font-bold text-lg text-on-surface mb-2">No nodes connected yet</h3>
        <p className="text-on-surface-variant text-sm max-w-md mx-auto mb-6">
          Once the agent starts running on your hardware, it will appear here as a manageable cluster node.
        </p>
        <Link href="/settings/agent" className="inline-block px-6 py-3 bg-surface-container-highest text-on-surface rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-surface-bright transition-colors">
          Install Agent
        </Link>
      </div>
    </div>
  );
}
