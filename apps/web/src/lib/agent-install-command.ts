const DEFAULT_API = 'http://localhost:4000';

/** `agentToken` is the server `dev_…` token from the API — not the user JWT. */
export function getAgentInstallCommand(agentToken: string): {
  full: string;
  /** Shortened token for on-screen display only */
  display: string;
} {
  const apiUrl =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || DEFAULT_API;
  const t = agentToken.trim();
  const tokenForCmd = t || 'YOUR_AGENT_TOKEN';
  // --background returns the shell immediately; same npx cache, no reinstall.
  const full = `npx devorbit-agent start --token=${tokenForCmd} --api=${apiUrl} --background`;
  const displayToken = t.length > 24 ? `${t.slice(0, 20)}…` : tokenForCmd;
  const display = `npx devorbit-agent start --token=${displayToken} --api=${apiUrl} --background`;
  return { full, display };
}
