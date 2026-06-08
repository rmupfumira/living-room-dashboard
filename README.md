# Smart Home Dashboard

A custom family-hub dashboard for the living-room wall panel. Talks to Home Assistant via WebSocket. Self-hosted on the LAN.

## Stack

- **Vite 5** + **React 18** + **TypeScript** — fast dev loop, small bundle
- **Tailwind CSS** for layout utilities; **CSS variables** for design tokens (OKLCH)
- **Framer Motion** for entrance / interaction animations
- **Zustand** for client state; **TanStack Query** for HA cache
- **home-assistant-js-websocket** — official HA WS client
- **lucide-react** for icons (matches the source design exactly)

## Requirements

- **Node.js 20 LTS** (or 18 minimum). Vite 5 + this codebase use modern syntax (`??=`, optional chaining) and won't run on Node 14/16.
  - Check: `node --version` — must report `v18.x.x` or higher.
  - Upgrade on Windows: download the LTS installer from https://nodejs.org or use `nvm-windows`.

## Getting started

```bash
cd dashboard-react
npm install
cp .env.example .env.local      # then edit with your HA URL + long-lived token
npm run dev                     # http://localhost:5173
```

## Project layout

```
src/
├── main.tsx                  React mount
├── App.tsx                   Shell: rail + header + view + tabs
├── styles/                   OKLCH tokens, globals, animations, shell layout
├── components/
│   ├── ui/                   Primitives: Icon, Switch, Ring, Arc, Toast, TweaksPanel
│   ├── widgets/              Dashboard cards: Weather, Doorbell, Music, Thermostat, …
│   └── views/                DashboardView, CamerasView, ScenesView, PowerView
├── state/                    Zustand stores: tweaks, dashboard, music
├── ha/                       Home Assistant WS client + hooks + entity map
└── data/mock.ts              Mock HA state — used until real WS is wired
```

## Build & deploy

### Local dev

```bash
npm run build                   # → dist/  (~200 KB gzipped)
```

### Self-hosted via Docker (Portainer-friendly)

Three files do all the work:

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage: Node 20-alpine builds the bundle → nginx-alpine serves it |
| `docker-compose.yml` | One service, exposes `${DASHBOARD_PORT:-8080}` on the LAN, joins a `homelab` bridge network |
| `deploy/nginx.conf` | SPA fallback, immutable caching for hashed assets, gzip on |
| `deploy.sh` | Local one-shot: `./deploy.sh` to build+start, `./deploy.sh logs` to tail, `./deploy.sh stop` to stop, `./deploy.sh pull` to git-pull and rebuild |

**From the homelab host:**

```bash
git clone <this-repo> dashboard-react
cd dashboard-react
cp .env.example .env            # tweak DASHBOARD_PORT / TZ if needed
./deploy.sh                     # http://<host-ip>:8080
```

**From Portainer (recommended):**

1. **Stacks → Add stack → Git repository**
2. Repository URL: `https://github.com/<you>/dashboard-react.git`
3. Compose path: `docker-compose.yml`
4. (Optional) **Enable automatic updates** — Portainer will git-poll and rebuild on every push to main
5. **Environment variables**: `DASHBOARD_PORT=8080`, `TZ=Africa/Johannesburg`
6. **Deploy the stack**

That's it — every `git push` to the dashboard repo will auto-redeploy the container.

## Current phase

**Phases 1-3 complete:** scaffold, design system, app shell, all dashboard widgets (Weather / Doorbell / Music / Thermostat / Light / Mood / Access / Scenes / Devices), Cameras / Scenes / Power views, and Docker deploy bundle.

**Phase 4 (HA wiring)** is pending. Currently the dashboard runs on mock data — every interaction works (toggle a switch, drag a dial, run a scene) but state is in-memory. Phase 4 swaps the mock store for `home-assistant-js-websocket` subscriptions.
