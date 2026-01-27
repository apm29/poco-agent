#!/usr/bin/env sh
set -eu

echo "=== Poco Executor Manager Container Starting ==="

exec /app/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8001}"
