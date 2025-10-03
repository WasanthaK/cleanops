#!/bin/sh
set -euo pipefail

SCHEMA_PATH="${PRISMA_SCHEMA_PATH:-../infra/prisma/schema.prisma}"

echo "Using Prisma schema at $SCHEMA_PATH"

pnpm prisma migrate deploy --schema "$SCHEMA_PATH"
pnpm run seed
nest start --watch
