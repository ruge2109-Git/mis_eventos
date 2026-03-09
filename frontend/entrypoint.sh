#!/bin/sh
set -e

echo "Generating frontend test coverage reports..."
npm run test:coverage

mkdir -p /app/reports/coverage-frontend
if [ -d "coverage/mis-eventos-app" ]; then
    cp -r coverage/mis-eventos-app/* /app/reports/coverage-frontend/
elif [ -d "coverage" ]; then
    cp -r coverage/* /app/reports/coverage-frontend/
fi

echo "Starting frontend development server..."
exec npx ng serve --host 0.0.0.0 --configuration development
