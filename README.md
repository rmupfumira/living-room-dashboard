# NOCTURNE

A precision-instrument smart-home command-deck dashboard for the living-room wall panel. Self-hosted on the LAN.

Aesthetic: obsidian canvas · solid flat panels · hairline borders · a single electric "argon" mint accent · monospace micro-labels · status LEDs · tabular numerals. Ships with two themes — **Nocturne** (dark, default) and **Daybreak** (light) — and a live accent-hue picker.

## Stack (deliberately minimal)

- **React 18** + **Vite 5** (JavaScript, no TypeScript)
- **Plain CSS with custom properties** — one stylesheet, `:root` for dark, `[data-theme="light"]` for light. The accent ramp is set from JS so it's theme-aware.
- **lucide-react** for icons (single-stroke, `strokeWidth={2}`)
- No state library, no UI kit, no CSS-in-JS, no chart library. State is local hooks; the energy sparkline is hand-rolled flex bars.

## Project layout

```
src/
  main.jsx                React mount
  App.jsx                 Shell: state, rail, header, board grid, theme/accent
  nocturne.css            Tokens (both themes) + all component styles
  data.js                 Mock HA dataset
  lib/
    format.js             fmtTime · fmtDur · f1
    accent.js             ACCENTS map + applyAccent(hex, dark)
  components/
    Rail.jsx · Header.jsx · SectionLabel.jsx · Switch.jsx · Led.jsx
    ClimateCard.jsx · EnergyCard.jsx · WeatherCard.jsx
    NowPlaying.jsx · DoorbellCard.jsx · SceneStrip.jsx
    AccessCard.jsx · DeviceCard.jsx · Toast.jsx
    ThemeToggle.jsx · AccentPicker.jsx
```

## Getting started

```bash
npm install
npm run dev                    # http://localhost:5173
npm run build                  # → dist/ (~196 KB gzipped)
```

Requires Node 20+.

## Self-hosted via Docker (Portainer-friendly)

Same deploy infrastructure as before — image was rebuilt to use Node 20.

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage: Node 20-alpine builds the bundle → nginx-alpine serves it |
| `docker-compose.yml` | One service, port `${DASHBOARD_PORT:-8080}`, joins a `homelab` bridge net |
| `deploy/nginx.conf` | SPA fallback, gzip on, immutable cache for hashed assets |
| `deploy.sh` | Local one-shot: `./deploy.sh` (up) · `stop` · `restart` · `logs` · `pull` |
| `.gitattributes` | Forces LF on shell scripts so deploy.sh works on Linux |

### From the homelab

```bash
git clone https://github.com/rmupfumira/kitchen-dashboard.git
cd kitchen-dashboard
cp .env.example .env
./deploy.sh                                   # http://<host>:8080
```

### From Portainer

1. **Stacks → Add stack → Web editor**, paste `docker-compose.yml`, OR
2. **Build method → Repository** (private repo needs a fine-grained PAT)
3. Env vars: `DASHBOARD_PORT=8080`, `TZ=Africa/Johannesburg`
4. **Deploy the stack**

## Two intentional design choices

1. **Card entrance is transform-only.** The cards rise on mount but their visible end state is the base style, never `opacity: 0 → 1`. Several hero cards re-render every second (clock, energy flicker, music progress); animating opacity would restart the animation each tick and pin the card invisible.
2. **Transitions are suppressed during theme flip.** Chromium can latch theme-derived properties mid-transition, leaving elements stuck at the old colour. The theme toggle disables `transition` for two animation frames, swaps `data-theme` + accent, then re-enables.

## What works today

Mock-data only. Every interaction is real (toggles, steppers, scene activation, music transport, doorbell unlock, search filter, room switching, live clock, energy flicker, theme + accent persistence) but state is in-memory.

## Phase 4 — real Home Assistant wiring

Pending. The hooks shape (`devices`, `climate`, `security`, `inverter`) already mirrors HA entity payloads, so the swap is local to App.jsx — every component stays untouched.
