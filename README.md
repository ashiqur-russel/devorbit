# DevOrbit

Open-source DevOps monitoring dashboard for developers and students. Monitor CI/CD pipelines, server health (CPU/RAM/disk), and deployment registries — all in one place.

**Self-hosted · MIT license · Docker Compose ready**

---

## Features

- **Pipeline Tracking** — GitHub Actions and GitLab CI run history, status, and duration
- **Server Health** — Real-time CPU, RAM, disk, and network metrics via a lightweight Node.js agent
- **Deployment Registry** — Track Vercel and custom deployments with live status
- **Team Workspaces** — GitHub OAuth login, invite members, manage projects per team
- **Real-time Updates** — Socket.io pushes agent metrics to the dashboard every 5 seconds

---

## Quick Start (Docker Compose)

**Prerequisites:** Docker + Docker Compose

```bash
git clone https://github.com/ashiqur-russel/devorbit.git
cd devorbit
cp .env.example .env
# Fill in .env — see Configuration below
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) and sign in with GitHub.

---

## Configuration

Copy `.env.example` to `.env` and set the following:

| Variable | Description |
|---|---|
| `JWT_SECRET` | Long random string for signing JWTs |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GITHUB_CALLBACK_URL` | `http://localhost:4000/api/v1/auth/github/callback` |
| `WEB_URL` | Frontend URL (default: `http://localhost:3000`) |
| `API_URL` | API URL (default: `http://localhost:4000`) |
| `WS_URL` | WebSocket URL (default: `ws://localhost:4000`) |

Create a GitHub OAuth App at [github.com/settings/developers](https://github.com/settings/developers).

### Nginx on port 80 (OVH / firewalls that block `:3000` and `:4000`)

Some clouds only allow **22, 80, 443** from the internet. Your Amuvee runbooks often use **Nginx as a reverse proxy**; Devorbit needs the same pattern, but with **three upstreams**: Next.js (`/`), Nest REST + Swagger (`/api/`), and Socket.io (`/socket.io/`).

1. Copy [`deploy/nginx/devorbit.conf`](deploy/nginx/devorbit.conf) to the server and enable the site (commands are in the file header).
2. Update root `.env` to use **no high ports** (replace with your public IP or domain):

   - `WEB_URL=http://YOUR_IP`
   - `API_URL=http://YOUR_IP`
   - `WS_URL=ws://YOUR_IP`
   - `GITHUB_CALLBACK_URL=http://YOUR_IP/api/v1/auth/github/callback`

3. Rebuild the **web** image so `NEXT_PUBLIC_*` matches: `docker compose up -d --build web` (API container can stay as-is; CORS uses `WEB_URL`).

4. Open **TCP 80** (and **443** after TLS) in your provider’s security group. Agents can use `--api=http://YOUR_IP` (port 80) because `/socket.io` is proxied to Nest.

**Troubleshooting GitHub login (`Failed to obtain access token`, `EHOSTUNREACH` from inside the API container):** some VPS providers block outbound internet from Docker’s default bridge. The compose file runs the **API** with `network_mode: host` so OAuth can reach GitHub; Mongo/Redis stay on the bridge and are reached via `127.0.0.1` published ports.

---

## Monorepo Structure

```
devorbit/
├── apps/
│   ├── web/        # Next.js 15 frontend (port 3000)
│   ├── api/        # NestJS backend (port 4000)
│   └── agent/      # Node.js monitoring agent
├── packages/
│   └── types/      # Shared TypeScript types
├── docker-compose.yml
└── .env.example
```

---

## Development Setup

**Prerequisites:** Node.js 20+, pnpm 9+

```bash
# Install all dependencies
pnpm install

# Start all services in watch mode
pnpm dev

# Or start individually
pnpm --filter @devorbit/api dev
pnpm --filter @devorbit/web dev
```

The API needs MongoDB and Redis running locally. Easiest way:

```bash
docker compose up mongodb redis -d
```

Then set `MONGODB_URI=mongodb://localhost:27017/devorbit` and `REDIS_URL=redis://localhost:6379` in `apps/api/.env`.

---

## Monitoring Agent

Install the agent on any server you want to monitor:

```bash
npx devorbit-agent start --token=<AGENT_TOKEN> --api=http://your-devorbit-instance:4000
```

Get your `AGENT_TOKEN` from **Settings → Agent Setup** in the dashboard. The agent:

- Collects CPU, RAM, disk, and network metrics every 5 seconds
- Streams data via WebSocket to your DevOrbit instance
- Auto-reconnects on disconnect
- Requires only Node.js — zero other dependencies

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS v4, Recharts, Socket.io client |
| Backend | NestJS 10, Mongoose 8, Passport.js + JWT, Socket.io |
| Database | MongoDB 7 (with Time Series Collections for metrics) |
| Cache / Queue | Redis 7, BullMQ |
| Agent | Node.js + systeminformation |
| Infrastructure | Docker Compose, Caddy (optional HTTPS) |

---

## Integrations

Connect third-party platforms under **Settings → Integrations**:

| Platform | What syncs |
|---|---|
| GitHub Actions | Workflow runs, status, duration, branch |
| GitLab CI | Pipeline runs (coming soon) |
| Vercel | Deployment status and preview URLs |

---

## API Docs

Swagger UI is available at [http://localhost:4000/api](http://localhost:4000/api) when the API is running.

---

## Contributing

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Make changes and run `pnpm build` to verify
3. Open a pull request against `main`

Please follow the [Conventional Commits](https://www.conventionalcommits.org/) format.

---

## License

MIT © [ashiqur-russel](https://github.com/ashiqur-russel)
