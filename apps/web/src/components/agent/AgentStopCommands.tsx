/** Copy-paste commands to find PID and stop `npx devorbit-agent` (e.g. after `--background`). */
export default function AgentStopCommands({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-4 font-mono text-xs leading-relaxed text-on-surface ${className}`}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-outline">On the server (bash)</p>
      <pre className="whitespace-pre-wrap break-all text-on-surface-variant">
        {`pgrep -af devorbit-agent
# → first number is PID, e.g. 24539 …/devorbit-agent/dist/cli.js …

kill 24539          # use your PID
pgrep -af devorbit-agent   # no output = stopped

kill -9 24539       # only if plain kill does not exit`}
      </pre>
      <p className="mt-3 text-[11px] text-outline">
        If you started with <code className="text-secondary">--background</code>, you can also use the{' '}
        <code className="text-secondary">Stop with: kill …</code> line printed when the agent started. Use PM2/systemd
        stop commands instead if you installed it that way.
      </p>
    </div>
  );
}
