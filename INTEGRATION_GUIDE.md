# Integration Guide - Phase 1 Implementation

This guide documents the implementation of Xero Integration, Evia Sign Integration, and Job Templates for CleanOps.

## Overview

Phase 1 adds three major features to CleanOps:
1. **Xero Accounting Integration** - Automated payroll export and accounting sync
2. **Evia Sign Integration** - Professional digital signatures for job completion
3. **Job Template System** - Reusable templates for common cleaning tasks

## Database Schema Changes

### New Models Added

The following models have been added to `infra/prisma/schema.prisma`:

#### Xero Integration Models
- `XeroIntegration` - Stores Xero connection details and encrypted tokens
- `XeroSyncLog` - Audit trail for sync operations
- `XeroSyncStatus` enum - Connection status tracking

#### Evia Sign Models
- `EviaSignDocument` - Digital signature document tracking
- `EviaSignTemplate` - Reusable document templates
- `EviaSignStatus` enum - Document lifecycle tracking

#### Job Template Models
- `JobTemplate` - Reusable job configurations
- `TaskTemplate` - Pre-defined tasks for templates

### Running Migrations

**Note:** Due to network restrictions during initial setup, Prisma migrations need to be run manually:

```bash
cd infra/prisma
npx prisma migrate dev --name add_integrations_and_templates
npx prisma generate
```

Once migrations are run, the Prisma client will be regenerated with the new models.

## API Endpoints

### Xero Integration

Base path: `/integrations/xero`

- `GET /connect` - Initiate OAuth connection (redirects to Xero)
- `POST /callback` - Handle OAuth callback
- `POST /disconnect/:tenantId` - Disconnect integration
- `POST /sync-payroll/:tenantId` - Sync payroll data to Xero
- `GET /status/:tenantId` - Get integration status

### Evia Sign Integration

Base path: `/integrations/evia-sign`

- `POST /send` - Send document for digital signing
- `GET /document/:id` - Get document status
- `POST /webhook/status` - Handle webhook callbacks from Evia Sign

### Job Templates

Base path: `/templates`

- `GET /` - List all templates (optional `?category=` filter)
- `GET /:id` - Get template details
- `POST /` - Create new template
- `PUT /:id` - Update template
- `DELETE /:id` - Soft delete template
- `POST /:id/create-job` - Create job from template
- `POST /seed` - Seed pre-built templates

## Environment Variables

Add the following to your `.env` file:

```bash
# Xero Integration
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret
XERO_REDIRECT_URI=http://localhost:3000/integrations/xero/callback

# Evia Sign Integration
EVIA_SIGN_API_KEY=your_evia_sign_api_key
EVIA_SIGN_API_URL=https://api.eviasign.com/v1
EVIA_SIGN_WEBHOOK_SECRET=your_evia_sign_webhook_secret

# Encryption Key for sensitive data
ENCRYPTION_KEY=your-32-character-encryption-key
```

## Setup Instructions

### 1. Install Dependencies

The following packages have been added:
- `xero-node` - Official Xero SDK
- `pdf-lib` - PDF generation for Evia Sign documents
- `handlebars` - Template rendering for documents

These are already installed via `pnpm install`.

### 2. Configure Xero

1. Create a Xero developer account at https://developer.xero.com
2. Create a new app with these settings:
   - App name: "CleanOps Integration"
   - Redirect URI: `http://localhost:3000/integrations/xero/callback`
   - Required scopes:
     - `accounting.transactions`
     - `payroll.employees`
     - `payroll.timesheets`
3. Copy Client ID and Secret to `.env`

### 3. Configure Evia Sign

1. Contact Evia Sign for API access
2. Request mobile-optimized workflow
3. Add API Key and Webhook Secret to `.env`

**For Development:** The Evia Sign integration works without API credentials using mock data.

### 4. Seed Pre-built Templates

After running migrations, seed the pre-built templates:

```bash
curl -X POST http://localhost:3000/templates/seed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This creates 4 pre-built templates:
- Standard Office Cleaning (commercial)
- Residential Deep Clean (residential)
- Window Cleaning Service (specialized)
- Post-Construction Clean (specialized)

## Features

### Xero Integration

**Key Features:**
- OAuth 2.0 authentication flow
- Automatic token refresh (tokens expire every 30 minutes)
- Encrypted token storage
- Payroll sync with audit logging
- Error handling and retry logic
- Multi-tenant support

**Security:**
- Tokens encrypted using AES-256-CBC
- Rate limiting support (60 req/min)
- Secure webhook validation

### Evia Sign Integration

**Key Features:**
- PDF generation for completion reports
- Mobile-optimized signing workflow
- Webhook-based status updates
- Fallback to mobile signature pad
- Signed PDF storage

**Document Types:**
- Completion reports
- Invoices (future)
- Contracts (future)

**Document Lifecycle:**
- DRAFT → SENT → VIEWED → SIGNED → COMPLETED

### Job Templates

**Key Features:**
- Pre-built templates for common jobs
- Customizable task lists
- Estimated time and pricing
- Category organization (commercial, residential, specialized)
- One-click job creation from templates

**Categories:**
- Commercial cleaning
- Residential cleaning
- Specialized services

## Testing

Tests have been added for all three integrations:

```bash
cd packages/api
pnpm test
```

Test files:
- `test/xero.service.spec.ts` - Xero integration tests
- `test/evia-sign.service.spec.ts` - Evia Sign integration tests
- `test/templates.service.spec.ts` - Template system tests

**Test Coverage:** The tests cover core functionality including:
- Service initialization
- CRUD operations
- Error handling
- Edge cases

## Usage Examples

### Creating a Job from Template

```typescript
POST /templates/template-id/create-job
Content-Type: application/json

{
  "siteId": "site-123",
  "title": "Weekly Office Clean - Building A",
  "scheduledDate": "2024-01-15T09:00:00Z",
  "workerIds": ["worker-123"],
  "description": "Regular weekly cleaning service"
}
```

### Syncing Payroll to Xero

```typescript
POST /integrations/xero/sync-payroll/tenant-id
Content-Type: application/json

{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "workerId": "worker-123" // optional
}
```

### Sending Document for Signing

```typescript
POST /integrations/evia-sign/send
Content-Type: application/json

{
  "jobId": "job-123",
  "recipientEmail": "client@example.com",
  "recipientName": "John Smith",
  "documentType": "completion_report"
}
```

## Architecture Notes

### Module Structure

All integrations follow NestJS module pattern:

```
packages/api/src/integrations/
├── xero/
│   ├── xero.controller.ts
│   ├── xero.service.ts
│   ├── xero.module.ts
│   └── dto/
├── evia-sign/
│   ├── evia-sign.controller.ts
│   ├── evia-sign.service.ts
│   ├── evia-sign.module.ts
│   └── dto/
└── ...

packages/api/src/templates/
├── templates.controller.ts
├── templates.service.ts
├── templates.module.ts
└── dto/
```

### Design Patterns

- **Controller-Service Pattern**: Business logic in services, HTTP handling in controllers
- **DTO Validation**: All inputs validated using class-validator
- **Error Handling**: Comprehensive try-catch with logging
- **Dependency Injection**: NestJS DI for clean architecture
- **Encryption**: AES-256-CBC for sensitive data

## Known Limitations

1. **Prisma Binaries**: Initial setup requires network access to download Prisma binaries. Once downloaded, subsequent builds work offline.

2. **Xero API Implementation**: The payroll sync endpoint currently creates the sync log but doesn't make actual Xero API calls. This needs to be implemented based on specific Xero payroll item mappings.

3. **Evia Sign Mock**: The integration uses mock document IDs when API credentials are not configured. Replace with actual Evia Sign API calls in production.

## Next Steps

### Immediate Tasks
1. Run database migrations
2. Configure API credentials
3. Test OAuth flows
4. Seed templates
5. Update OpenAPI documentation

### Production Readiness
1. Implement actual Xero payroll API calls
2. Integrate real Evia Sign API
3. Add rate limiting middleware
4. Set up production encryption keys
5. Configure webhook endpoints
6. Add monitoring and alerting

## Support

For issues or questions:
1. Check HANDOVER.md for detailed specifications
2. Review ENHANCEMENT-PLAN.md for implementation details
3. Check existing tests for usage examples
4. Review code comments in service files

## License

See LICENSE file in repository root.
