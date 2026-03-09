#!/bin/sh
set -e

echo "Generating frontend test coverage reports..."
npm run test:coverage -- --reports-directory=/app/reports/coverage-frontend

echo "Starting frontend development server..."
exec npx ng serve --host 0.0.0.0 --disable-host-check --configuration development
