# CleanOps Work Completion Platform

CleanOps is an offline-capable work completion platform tailored for cleaning and field service companies operating in Australia. The monorepo contains a NestJS API, a React + Vite progressive web app (PWA), infrastructure definitions, and shared tooling that enable workers to capture attendance, tasks, photos, and client sign-off even when completely offline.

## Repository Structure

```
cleanops/
  README.md
  docker-compose.yml
  .env.example
  packages/
    api/            # NestJS microservice
    web/            # React PWA (Vite)
  infra/
    prisma/         # Prisma schema and migrations
    openapi/        # OpenAPI specification
```

## Getting Started

### Prerequisites

* Docker and Docker Compose v2
* Node.js 18+ and pnpm 8+ (for local development without Docker)
* OpenSSL (for generating development JWT secrets if desired)

### 1. Configure Environment Variables

Copy the example environment file and adjust values as needed:

```bash
cp .env.example .env
```

The API uses `packages/api/.env` during local development. Docker Compose will load variables from the root `.env`.

### 2. Install Dependencies (optional)

If you plan to run services outside of Docker, install dependencies with pnpm:

```bash
pnpm install
```

### 3. Run via Docker Compose

```bash
docker compose up --build
```

This command starts the following services:

* **postgres** – Postgres 15 database for transactional storage.
* **minio** – S3-compatible object storage for photo uploads.
* **api** – NestJS API (port `3000`).
* **web** – Vite development server (port `5173`, proxied through the `api` container for `/api`).

The first launch runs Prisma migrations and seeds demo data (one worker and job). The OpenAPI documentation is available at [http://localhost:3000/docs](http://localhost:3000/docs).

### 4. Local Development Without Docker

Run services individually if preferred:

```bash
# Terminal 1 – database & storage
docker compose up postgres minio

# Terminal 2 – API
cd packages/api
pnpm install
pnpm prisma migrate deploy
pnpm run start:dev

# Terminal 3 – Web
cd packages/web
pnpm install
pnpm run dev
```

### 5. Running Tests

```bash
pnpm test
```

This runs Jest unit tests for the award calculation helper and the offline queue logic.

### Deployment Notes

* Configure persistent volumes for Postgres and MinIO to satisfy 7-year retention requirements.
* Update JWT secrets and S3 credentials for production.
* Configure HTTPS termination and service worker scope via reverse proxy (e.g., Nginx, Traefik).
* Schedule regular backups for the database and object storage.

## Acceptance Criteria Checklist

- [ ] PWA installs on Android/iOS; offline shell works.
- [ ] Travel/arrival/clock-in/out captured with timestamps and GPS.
- [ ] Before/after photos saved offline and later uploaded to MinIO via signed URLs.
- [ ] Client sign-off captured with e-signature.
- [ ] Offline queue flushes on connectivity or Background Sync.
- [ ] Payroll draft endpoint returns OT breakdown based on stub award config.
- [ ] OpenAPI served at `/docs` and spec file present in `infra/openapi/openapi.yaml`.

Update each item as you verify the implementation.

## License

This project is provided under the MIT License. See [LICENSE](LICENSE) for details.
