# Database Migrations for Phase 1

This directory contains the migration for Phase 1 integrations.

## Migration: add_integrations_and_templates

This migration adds the following:

### New Enums
- `XeroSyncStatus` - CONNECTED, SYNCING, ERROR, DISCONNECTED
- `EviaSignStatus` - DRAFT, SENT, VIEWED, SIGNED, COMPLETED, EXPIRED, CANCELLED, DECLINED

### New Tables

#### Xero Integration
- `XeroIntegration` - Stores Xero connection details
- `XeroSyncLog` - Audit trail for sync operations

#### Evia Sign Integration
- `EviaSignDocument` - Document signing workflow tracking
- `EviaSignTemplate` - Reusable document templates

#### Job Templates
- `JobTemplate` - Reusable job configurations
- `TaskTemplate` - Task definitions for templates

### Modified Tables
- `Job` - Added `eviaSignDocs` relation

## Running the Migration

```bash
cd infra/prisma
npx prisma migrate dev --name add_integrations_and_templates
```

Or in production:

```bash
npx prisma migrate deploy
```

## Manual SQL (if Prisma CLI unavailable)

The migration SQL can be generated manually or run the migration when Prisma CLI is available.

Key changes:
1. Create enum types
2. Create integration tables with proper indexes
3. Add foreign key constraints
4. Create audit log tables

## Rollback

To rollback this migration:

```bash
npx prisma migrate rollback
```

Or manually drop the tables and enums in reverse order.
