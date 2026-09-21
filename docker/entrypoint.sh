#!/usr/bin/env bash
# Entrypoint used by the dev Docker image. Waits for the database to be ready
# and then runs migrations. For production images, migrations are run as a
# separate one-shot step (see README.md).

set -e

echo "[entrypoint] Waiting for database..."
until pg_isready -h "${DATABASE_HOST:-postgres}" -p "${DATABASE_PORT:-5432}" -U "${DATABASE_USER:-postgres}"; do
  sleep 1
done

echo "[entrypoint] Running database migrations..."
bundle exec rake db:migrate || true

echo "[entrypoint] Seeding database..."
bundle exec rake db:seed || true

echo "[entrypoint] Starting application..."
exec "$@"