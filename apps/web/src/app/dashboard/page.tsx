export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tighter font-headline text-on-surface">Dashboard</h1>
        <p className="text-on-surface-variant text-sm mt-1">Infrastructure overview</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Servers', value: '0', color: 'secondary', icon: '⬡' },
          { label: 'Pipeline Runs Today', value: '0', color: 'primary', icon: '⟩' },
          { label: 'Deployments', value: '0', color: 'tertiary', icon: '↑' },
        ].map((card) => (
          <div key={card.label} className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/5">
            <div className="flex justify-between items-start mb-4">
              <p className={`text-xs font-bold uppercase tracking-widest text-${card.color} font-headline`}>{card.label}</p>
              <span className={`text-2xl text-${card.color}`}>{card.icon}</span>
            </div>
            <p className="text-4xl font-black font-headline tracking-tighter text-on-surface">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent pipelines */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/5">
        <div className="p-6 border-b border-outline-variant/10">
          <h2 className="text-sm font-bold uppercase tracking-widest font-headline text-on-surface">Recent Pipelines</h2>
        </div>
        <div className="p-6 text-center text-on-surface-variant text-sm py-12">
          No pipelines yet. Connect GitHub to get started.
        </div>
      </div>

      {/* Server health */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/5">
        <div className="p-6 border-b border-outline-variant/10">
          <h2 className="text-sm font-bold uppercase tracking-widest font-headline text-on-surface">Server Health</h2>
        </div>
        <div className="p-6 text-center text-on-surface-variant text-sm py-12">
          No servers connected. Install the agent to start monitoring.
        </div>
      </div>
    </div>
  );
}
