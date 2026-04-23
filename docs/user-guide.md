# Devorbit — User Guide (Dashboard + Integrations + Troubleshooting)

This guide explains how Devorbit works end‑to‑end: the user journey, what each page means, how Pipelines/Deployments/Servers connect, and how to troubleshoot common problems.

---

## 1) Big picture: what Devorbit tracks

Devorbit has three main “data streams”:

1. **Pipelines** (CI runs)
   - **Source**: GitHub Actions / GitLab CI (polled by the API using your integration token).
   - **Shows**: workflow name, branch, status, duration, who triggered it.

2. **Deployments** (releases shipped)
   - **Source**: platform integrations (ex: **Vercel**) and CI “reporting” (ex: **VPS/OVH** deploy workflow reports to Devorbit).
   - **Shows**: project, platform (Vercel/OVH/…), status, when it was deployed, optional URL.

3. **Servers** (infrastructure health)
   - **Source**: Devorbit Agent installed on your server.
   - **Shows**: CPU/RAM/disk/network, online/offline status.

---

## 2) Roles, organizations, teams (access control)

Devorbit is multi‑tenant:

- **Organization**: top-level tenant boundary
- **Team**: scope for projects, servers, integrations
- **Users**: belong to org(s) and team(s)

### Roles

- **SUPER_ADMIN (org)**: can do everything (create org teams, invite users, grant admin capabilities, install agents)
- **ADMIN (org)**: can help manage org/team but may need capabilities enabled
- **MEMBER (org)**: normal user

### Admin capabilities

Some admin powers are *explicitly granted*:

- **canCreateTeams**: admin can create teams (workspaces)
- **canInstallAgent**: admin can register/install agents (servers)

These are granted by a SUPER_ADMIN via **Settings → Organization → Org admin powers**.

---

## 3) User journey (what a new user does)

### A) Sign up / Sign in

- **Email/password**: `/register` then `/login`
- **GitHub**: “Sign in with GitHub”

### B) Create or join an organization

You can:

- **Create a new org** during register (enter organization name)
- **Join an existing org** via invite link (register with `?invite=...`)

### C) Create a team (workspace)

Team creation requires:

- SUPER_ADMIN, or
- ADMIN with `canCreateTeams=true`

### D) Connect integrations

Go to **Settings → Integrations**:

- **GitHub**: required for Pipelines from GitHub Actions
- **Vercel**: required for Vercel Deployments

### E) Create a Project (links data to a team)

Go to **Projects**:

- Add project name
- Optional: link repo (`repoOwner`, `repoName`, provider)
- Optional: set Vercel Project ID (`vercelProjectId`)

### F) See Pipelines and Deployments

- **Pipelines**: show when repo is linked + GitHub integration is valid + workflow runs exist
- **Deployments**:
  - Vercel deployments show if Vercel is connected + `vercelProjectId` is set
  - VPS/OVH deployments show if your CI deploy workflow reports them

---

## 4) Dashboard pages (what they mean)

### Dashboard
High-level summary. If it says “no pipelines yet”, it typically means:
- GitHub isn’t connected, or
- Projects aren’t linked to repos, or
- Token doesn’t have access to that repo’s Actions.

### Organizations
View orgs you belong to and open org dashboards.

### Projects
Projects are the “anchor” that ties together:
- Pipelines (repo link)
- Deployments (Vercel/VPS reporting)
- Servers (optional association)

### Pipelines
Shows recent CI runs for your team’s linked repos.

### Deployments
Shows deployments across platforms (Vercel now; VPS reporting supported via CI).

**Target column**: “where it deployed to” (Vercel environment/server/etc). Some providers may show `—` if not supplied.

### Servers
Lists registered servers for your team. Server access is team-scoped.

---

## 5) VPS/OVH deployments: how “deployment display” works

If your app is deployed to a VPS (OVH, Hetzner, DigitalOcean, AWS EC2, etc.), Devorbit can’t “magically” know you deployed—so we use **CI reporting**:

1. You deploy on your server using a CI workflow (example: GitHub Actions).
2. After deploy succeeds, the workflow calls Devorbit:
   - `POST /api/v1/deployments/report`
   - Auth: `x-devorbit-deploy-token: <token>`
3. Devorbit stores the deployment and displays it in Deployments.

### Required setup (per project)

In **Projects → Manage → VPS deployments**:

- Generate a **Deploy Token** (shown once)
- Add these GitHub Secrets in the repo that deploys:
  - `DEVORBIT_PROJECT_ID`
  - `DEVORBIT_DEPLOY_TOKEN`

> Each customer does this on *their own repo*. It does not affect other customers.

---

## 6) Troubleshooting (most common issues)

### A) “Pipelines page is empty”

Check:

1. **GitHub integration token**
   - Must have access to the repo
   - Must include **Actions: Read** + **Contents/Metadata: Read**
2. **Project repo fields**
   - `repoOwner` and `repoName` must be correct
3. **Repo actually has workflow runs**
   - Ensure Actions runs exist in GitHub

### B) “Deployments show only Vercel projects”

That’s expected unless:

- you connected Vercel AND set `vercelProjectId` **for each project**, OR
- you enabled VPS reporting via CI (deploy token + deploy workflow report call)

### C) “VPS deployment reporting failed (502 / can’t connect)”

Common causes:

- **CI cannot reach your Devorbit API** because only ports 80/443 are open (or API is behind Nginx)
- Use CI reporting **from inside the server** (SSH step) or proxy correctly via Nginx

### D) “deployments/report returns 400”

Common causes:

- **Wrong `DEVORBIT_PROJECT_ID`** (must be the Project ID, not team id)
- **Deploy token has a trailing newline** (copy/paste issue)
- Project doesn’t have token configured (generate token again)

### E) “Server shows offline but agent is running”

Devorbit uses last-seen heartbeat + stale checks. Check:

- Agent is running (systemd/docker)
- API `AGENT_OFFLINE_AFTER_MS` and stale interval configs
- Time drift on server can cause weird “lastSeen”

---

## 7) If something breaks: what to collect

When reporting an issue, collect:

- Screenshot of the page (Pipelines/Deployments/Servers)
- The exact repo/project name and team you’re viewing
- If it’s CI/CD related: paste the failing GitHub Actions step log
- If it’s server/agent related: recent API logs + agent logs

---

## 8) Glossary

- **Project**: a logical app/service in Devorbit tied to a Team
- **Pipeline**: CI run (GitHub Actions/GitLab)
- **Deployment**: a release event (Vercel, VPS, etc.)
- **Target**: where a deployment went (environment/server)
- **Integration**: credentials/config to fetch data from a provider

