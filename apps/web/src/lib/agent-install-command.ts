const DEFAULT_API = 'http://localhost:4000';

export function getAgentInstallCommand(token: string): {
  full: string;
  /** Shortened token for on-screen display only */
  display: string;
} {
  const apiUrl =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || DEFAULT_API;
  const t = token.trim();
  const tokenForCmd = t || 'YOUR_AGENT_TOKEN';
  const full = `npx devorbit-agent start --token=${tokenForCmd} --api=${apiUrl}`;
  const displayToken =
    t.length > 24 ? `${t.slice(0, 20)}…` : tokenForCmd;
  const display = `npx devorbit-agent start --token=${displayToken} --api=${apiUrl}`;
  return { full, display };
}
