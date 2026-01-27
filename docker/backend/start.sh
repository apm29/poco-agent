#!/usr/bin/env sh
set -eu

echo "=== Poco Backend Container Starting ==="

run_migrations="${RUN_MIGRATIONS:-true}"
if [ "${run_migrations}" = "true" ] || [ "${run_migrations}" = "1" ] || [ "${run_migrations}" = "yes" ]; then
  echo "Waiting for database to be ready..."
  /app/.venv/bin/python - <<'PY'
import os
import time
from urllib.parse import urlparse

import psycopg2


def main() -> None:
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        print("DATABASE_URL is empty, skip DB wait.")
        return

    parsed = urlparse(url)
    if parsed.scheme not in {"postgres", "postgresql"}:
        print(f"DATABASE_URL scheme={parsed.scheme!r}, skip DB wait.")
        return

    deadline = time.time() + int(os.environ.get("DB_WAIT_TIMEOUT_SECONDS", "60"))
    while time.time() < deadline:
        try:
            conn = psycopg2.connect(url)
            conn.close()
            print("Database is ready.")
            return
        except Exception:
            time.sleep(2)

    raise SystemExit("Database not ready within timeout.")


if __name__ == "__main__":
    main()
PY

  echo "Running Alembic migrations..."
  /app/.venv/bin/alembic upgrade head
else
  echo "RUN_MIGRATIONS is disabled; skipping migrations."
fi

echo "Starting Backend API server..."
exec /app/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
