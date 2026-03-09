FROM python:3.12-slim

WORKDIR /app

ENV PYTHONPATH=/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install poetry
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

COPY . .

RUN chmod +x /app/entrypoint.sh

RUN mkdir -p /app/reports && \
    pytest --cov=app --cov-report=html:/app/reports/coverage-backend --cov-report=term-missing

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
