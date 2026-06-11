#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# deploy.sh — one-shot local deploy / restart of the dashboard.
#
# Usage:
#   ./deploy.sh                 # git pull + build + start (default)
#   DASHBOARD_PORT=9000 ./deploy.sh
#   ./deploy.sh logs            # tail logs
#   ./deploy.sh stop            # stop the stack
#   ./deploy.sh restart         # stop + git pull + rebuild + start
#   ./deploy.sh no-pull         # rebuild + start WITHOUT git pull
#                               # (useful if you're testing local changes)
#
# Portainer note: you can skip this script entirely and add this repo as a
# Stack in Portainer → Stacks → Git repository → Compose path: docker-compose.yml.
# Portainer will git-pull + rebuild on its own schedule.
# ──────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")"

# Resolve `docker compose` v2 (preferred) vs `docker-compose` v1 (fallback).
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "ERROR: docker compose plugin not found." >&2
  exit 1
fi

# Pull latest from git unless the caller asked us not to.
# Returns 0 if anything changed (so caller can decide whether to rebuild).
git_pull() {
  if [[ ! -d .git ]]; then
    echo "ℹ Not a git checkout — skipping pull."
    return 0
  fi
  echo "▸ git pull…"
  local before
  before=$(git rev-parse HEAD 2>/dev/null || echo "")
  if ! git pull --ff-only; then
    echo "  ↪ pull failed (network? local changes?) — continuing with current commit." >&2
  fi
  local after
  after=$(git rev-parse HEAD 2>/dev/null || echo "")
  if [[ "$before" != "$after" ]]; then
    echo "  ↪ pulled $before → $after"
  else
    echo "  ↪ already at latest ($after)"
  fi
}

cmd="${1:-up}"

case "$cmd" in
  up|start|deploy|pull)
    git_pull
    echo "▸ Building image and starting container…"
    $COMPOSE up -d --build
    echo
    HOST_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo localhost)
    echo "✔ Dashboard is up at http://${HOST_IP}:${DASHBOARD_PORT:-8080}"
    ;;
  no-pull|local|rebuild)
    echo "▸ Skipping git pull — building from local working tree."
    $COMPOSE up -d --build
    echo "✔ Done."
    ;;
  stop|down)
    echo "▸ Stopping…"
    $COMPOSE down
    ;;
  restart)
    git_pull
    echo "▸ Restarting…"
    $COMPOSE down
    $COMPOSE up -d --build
    ;;
  logs)
    $COMPOSE logs -f --tail=200
    ;;
  *)
    echo "Usage: $0 [up|stop|restart|logs|no-pull]" >&2
    echo "  up        (default) git pull + build + start" >&2
    echo "  stop      stop the container" >&2
    echo "  restart   git pull + stop + build + start" >&2
    echo "  logs      tail container logs" >&2
    echo "  no-pull   build + start without pulling (test local edits)" >&2
    exit 2
    ;;
esac
