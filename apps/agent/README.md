# devorbit-agent

Lightweight Node.js agent that streams CPU, RAM, disk, and network metrics to your [DevOrbit](https://github.com/ashiqur-russel/devorbit) dashboard over WebSocket.

## Run

```bash
npx devorbit-agent start --token=dev_… --api=https://your-devorbit-api.example.com --background
```

- Get `--token` from the dashboard: **Settings → Agent**.
- `--background` detaches from SSH; the CLI prints **`Stop with: kill <pid>`** — keep that line to stop the agent later.

## Find PID and stop

```bash
pgrep -af devorbit-agent
# Example: 24539 /usr/bin/node .../devorbit-agent/dist/cli.js start ...
kill 24539          # use your PID
pgrep -af devorbit-agent   # expect no output when stopped
```

If the process does not exit:

```bash
kill -9 24539
```

If you run the agent under **PM2**, **systemd**, **cron**, or **Docker**, stop or remove that configuration so it does not restart.

## Token hygiene

Treat `dev_…` like a password for that server. For a new machine, register a new server in Devorbit and use a **new** token.

More detail: repo root `README.md` (Monitoring Agent → Stopping), `docs/agent-guide.html`, and **Settings → Agent** in the web app.
