#!/usr/bin/env bash
set -euo pipefail

echo "=== Poco Executor Container Starting ==="

export DISPLAY="${DISPLAY:-:1}"

enable_sandbox_services="${ENABLE_SANDBOX_SERVICES:-auto}"
supervisor_conf="${SUPERVISOR_CONF:-/etc/supervisor/conf.d/supervisord.conf}"

can_start_sandbox_services="false"
if command -v supervisord >/dev/null 2>&1 && [ -f "${supervisor_conf}" ]; then
  can_start_sandbox_services="true"
fi

if [ "${enable_sandbox_services}" = "0" ] || [ "${enable_sandbox_services}" = "false" ] || [ "${enable_sandbox_services}" = "no" ]; then
  echo "Sandbox services disabled (ENABLE_SANDBOX_SERVICES=${enable_sandbox_services})"
elif [ "${enable_sandbox_services}" = "1" ] || [ "${enable_sandbox_services}" = "true" ] || [ "${enable_sandbox_services}" = "yes" ]; then
  echo "Starting sandbox services (VNC, code-server, Caddy)..."
  if [ "${can_start_sandbox_services}" = "true" ]; then
    supervisord -c "${supervisor_conf}" &
    supervisor_pid=$!

    sleep 3

    if kill -0 "${supervisor_pid}" 2>/dev/null; then
      echo "Sandbox services started successfully"
      echo "  - VNC available via noVNC on port 8080"
      echo "  - code-server available on port 8080/code/"
    else
      echo "WARN: supervisord exited; continuing without sandbox services"
    fi
  else
    echo "WARN: supervisord not found or config missing; continuing without sandbox services"
  fi
else
  # auto (default): start only when available.
  if [ "${can_start_sandbox_services}" = "true" ]; then
    echo "Starting sandbox services (VNC, code-server, Caddy)..."
    supervisord -c "${supervisor_conf}" &
    supervisor_pid=$!

    sleep 3

    if kill -0 "${supervisor_pid}" 2>/dev/null; then
      echo "Sandbox services started successfully"
      echo "  - VNC available via noVNC on port 8080"
      echo "  - code-server available on port 8080/code/"
    else
      echo "WARN: supervisord exited; continuing without sandbox services"
    fi
  else
    echo "Sandbox services not available; skipping"
  fi
fi

echo "Starting Executor API server on port 8000..."
cd /app
if command -v su >/dev/null 2>&1; then
  exec su ubuntu -c "/app/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000"
fi

echo "WARN: 'su' not found; starting API as $(id -un)"
exec /app/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
