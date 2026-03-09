#!/bin/bash
set -e

echo "Waiting for database..."
until python -c "import psycopg2; psycopg2.connect('$DATABASE_URL')" 2>/dev/null; do
    echo "Database is unavailable - sleeping"
    sleep 2
done

echo "Database is up! Running migrations..."
alembic upgrade head

echo "Seeding admin user..."
python -m app.scripts.seed_admin || echo "Admin user may already exist"

echo "Starting application..."
exec uvicorn app.infrastructure.api.main:app --host 0.0.0.0 --port 8000 --reload
