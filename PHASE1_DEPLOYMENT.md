# Phase 1 Deployment Guide

This guide provides step-by-step instructions for deploying the Phase 1 integrations (Xero, Evia Sign, and Job Templates).

## Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (for local development)
- PostgreSQL 15
- Access to Xero Developer Portal
- Evia Sign API credentials (optional for development)

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd /path/to/cleanops
pnpm install
```

Dependencies added in Phase 1:
- `xero-node` - Xero API integration
- `pdf-lib` - PDF document generation
- `handlebars` - Template rendering

### 2. Configure Environment

Copy the environment template:

```bash
cp .env.example .env
```

Add your credentials to `.env`:

```bash
# Xero Integration (required for Xero features)
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret
XERO_REDIRECT_URI=http://localhost:3000/integrations/xero/callback

# Evia Sign Integration (optional - uses mocks if not provided)
EVIA_SIGN_API_KEY=your_evia_sign_api_key
EVIA_SIGN_API_URL=https://api.eviasign.com/v1
EVIA_SIGN_WEBHOOK_SECRET=your_evia_sign_webhook_secret

# Encryption Key (generate secure key for production)
ENCRYPTION_KEY=your-32-character-encryption-key
```

**Generate Encryption Key:**

```bash
# Generate a random 32-character key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 3. Run Database Migrations

```bash
cd infra/prisma
npx prisma migrate dev --name add_integrations_and_templates
npx prisma generate
```

This will:
- Create new database tables for integrations
- Generate Prisma client with new models
- Enable type-safe database access

### 4. Start Services

**With Docker Compose (Recommended):**

```bash
docker-compose up -d
cd packages/api
pnpm start:dev
```

**Without Docker:**

```bash
# Start PostgreSQL and MinIO manually
cd packages/api
pnpm start:dev
```

### 5. Seed Templates

Once the API is running, seed the pre-built templates:

```bash
# Get authentication token first
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@example.com",
    "password": "password123"
  }'

# Use the token to seed templates
curl -X POST http://localhost:3000/templates/seed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Detailed Setup

### Xero Integration Setup

#### 1. Create Xero App

1. Go to https://developer.xero.com/myapps
2. Click "New app"
3. Fill in details:
   - **App name:** CleanOps Integration
   - **Integration type:** Web app
   - **Company or application URL:** http://localhost:3000
   - **OAuth 2.0 redirect URI:** http://localhost:3000/integrations/xero/callback

4. Select scopes:
   - ✅ `accounting.transactions` - For invoice and expense tracking
   - ✅ `payroll.employees` - For employee data
   - ✅ `payroll.timesheets` - For time tracking sync

5. Save and copy:
   - Client ID
   - Client Secret

#### 2. Configure in CleanOps

Add to `.env`:

```bash
XERO_CLIENT_ID=abc123...
XERO_CLIENT_SECRET=xyz789...
XERO_REDIRECT_URI=http://localhost:3000/integrations/xero/callback
```

#### 3. Test Connection

```bash
# Initiate OAuth flow (will redirect to Xero)
curl http://localhost:3000/integrations/xero/connect

# After authorization, handle callback
curl -X POST http://localhost:3000/integrations/xero/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "authorization_code_from_xero",
    "tenantId": "optional_tenant_id"
  }'
```

### Evia Sign Integration Setup

#### 1. Contact Evia Sign

Contact Evia Sign sales team to:
- Request API access
- Specify mobile-optimized workflow requirement
- Request webhook configuration

#### 2. Configure in CleanOps

Add to `.env`:

```bash
EVIA_SIGN_API_KEY=your_api_key
EVIA_SIGN_API_URL=https://api.eviasign.com/v1
EVIA_SIGN_WEBHOOK_SECRET=your_webhook_secret
```

#### 3. Configure Webhooks

Configure Evia Sign to send webhooks to:

```
POST https://your-domain.com/integrations/evia-sign/webhook/status
```

Include header:
```
X-Evia-Signature: <hmac-sha256-signature>
```

#### 4. Development Mode

**Without API credentials**, the integration uses mock responses:
- Document IDs are generated locally
- PDFs are created but not sent to Evia Sign
- Status updates must be triggered manually

### Job Templates Setup

#### 1. Seed Pre-built Templates

```bash
curl -X POST http://localhost:3000/templates/seed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This creates:
1. **Standard Office Cleaning** (Commercial)
   - 6 tasks, 2.5 hours, $150 base price
2. **Residential Deep Clean** (Residential)
   - 7 tasks, 4 hours, $250 base price
3. **Window Cleaning Service** (Specialized)
   - 3 tasks, 1.5 hours, $100 base price
4. **Post-Construction Clean** (Specialized)
   - 6 tasks, 6 hours, $400 base price

#### 2. Create Custom Template

```bash
curl -X POST http://localhost:3000/templates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Cleaning Template",
    "category": "commercial",
    "description": "Description of the template",
    "estimatedHours": 3,
    "basePrice": 200,
    "tasks": [
      {
        "title": "Task 1",
        "description": "Task description",
        "estimatedMinutes": 30,
        "required": true,
        "orderIndex": 0
      }
    ]
  }'
```

## Usage Examples

### Example 1: Sync Payroll to Xero

```bash
curl -X POST http://localhost:3000/integrations/xero/sync-payroll/YOUR_TENANT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "workerId": "worker-123"
  }'
```

### Example 2: Send Document for Signing

```bash
curl -X POST http://localhost:3000/integrations/evia-sign/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "job-123",
    "recipientEmail": "client@example.com",
    "recipientName": "John Smith",
    "documentType": "completion_report"
  }'
```

### Example 3: Create Job from Template

```bash
curl -X POST http://localhost:3000/templates/TEMPLATE_ID/create-job \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "site-123",
    "title": "Weekly Office Clean - Building A",
    "scheduledDate": "2024-01-15T09:00:00Z",
    "workerIds": ["worker-123"],
    "description": "Regular weekly cleaning"
  }'
```

### Example 4: Check Xero Integration Status

```bash
curl http://localhost:3000/integrations/xero/status/YOUR_TENANT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 5: Get Document Status

```bash
curl http://localhost:3000/integrations/evia-sign/document/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing

### Run Unit Tests

```bash
cd packages/api
pnpm test
```

Test files:
- `test/xero.service.spec.ts` - Xero integration
- `test/evia-sign.service.spec.ts` - Evia Sign integration
- `test/templates.service.spec.ts` - Job templates

### Manual Testing Checklist

- [ ] Xero OAuth flow completes successfully
- [ ] Xero tokens refresh automatically
- [ ] Payroll sync creates log entries
- [ ] Evia Sign document creation works
- [ ] PDF generation is correct
- [ ] Webhook handling updates document status
- [ ] Templates can be listed and filtered
- [ ] Jobs can be created from templates
- [ ] Pre-built templates seed correctly

## Production Deployment

### 1. Environment Configuration

Update `.env` for production:

```bash
# Use production URLs
XERO_REDIRECT_URI=https://your-domain.com/integrations/xero/callback
EVIA_SIGN_API_URL=https://api.eviasign.com/v1

# Generate secure encryption key
ENCRYPTION_KEY=<64-character-hex-string>

# Database
DATABASE_URL=postgresql://user:pass@prod-host:5432/cleanops

# Enable HTTPS
NODE_ENV=production
```

### 2. Security Checklist

- [ ] Use strong encryption key (not the default)
- [ ] Enable HTTPS for all endpoints
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable authentication on all endpoints
- [ ] Validate webhook signatures
- [ ] Use environment-specific Xero redirect URIs
- [ ] Rotate API credentials regularly
- [ ] Monitor sync logs for errors
- [ ] Set up alerting for failed syncs

### 3. Database Backups

```bash
# Backup before migrations
pg_dump cleanops > backup_$(date +%Y%m%d).sql

# Run migrations
npx prisma migrate deploy

# Verify data integrity
```

### 4. Monitoring

Monitor these metrics:
- Xero token refresh success rate
- Payroll sync completion time
- Evia Sign webhook delivery success
- Document signing completion rate
- Template usage statistics
- API error rates

### 5. Rollback Plan

If issues occur:

```bash
# Revert database migrations
npx prisma migrate rollback

# Restore from backup
psql cleanops < backup_YYYYMMDD.sql

# Disable integrations in code
# Set feature flags to false
```

## Troubleshooting

### Issue: Prisma Client Not Found

**Solution:**
```bash
cd infra/prisma
npx prisma generate
```

### Issue: Xero Token Expired

**Solution:**
Tokens auto-refresh every 30 minutes. If manual refresh needed:
```bash
curl -X POST http://localhost:3000/integrations/xero/refresh/TENANT_ID
```

### Issue: Webhook Signature Invalid

**Solution:**
1. Verify `EVIA_SIGN_WEBHOOK_SECRET` matches Evia Sign configuration
2. Check webhook payload format
3. Enable debug logging in `evia-sign.service.ts`

### Issue: Template Creation Fails

**Solution:**
1. Check all required fields are provided
2. Verify task order indices are unique
3. Ensure user has proper permissions
4. Check logs for validation errors

### Issue: Build Fails with TypeScript Errors

**Solution:**
```bash
# Regenerate Prisma client
cd infra/prisma
npx prisma generate

# Clean and rebuild
cd ../../packages/api
rm -rf dist
pnpm build
```

## API Documentation

Full API documentation available at:
- Swagger UI: http://localhost:3000/api
- OpenAPI JSON: http://localhost:3000/api-json

## Support Resources

- **INTEGRATION_GUIDE.md** - Detailed technical documentation
- **HANDOVER.md** - Complete specifications
- **FEATURES.md** - Feature requirements
- **USER-GUIDE.md** - API usage examples

## Performance Optimization

### Xero API Rate Limits

Xero limits: 60 requests per minute

**Optimization strategies:**
- Batch payroll records when syncing
- Cache tenant information
- Implement exponential backoff
- Queue sync requests during high load

### Database Queries

**Optimization:**
- Index frequently queried fields:
  ```sql
  CREATE INDEX idx_xero_tenant ON "XeroIntegration"("tenantId");
  CREATE INDEX idx_evia_doc ON "EviaSignDocument"("eviaDocId");
  CREATE INDEX idx_template_category ON "JobTemplate"("category");
  ```

### PDF Generation

**Optimization:**
- Generate PDFs asynchronously
- Cache template renders
- Use compression for storage
- Optimize image sizes

## Maintenance

### Weekly Tasks
- [ ] Review sync logs for errors
- [ ] Check token refresh success rate
- [ ] Monitor webhook delivery
- [ ] Review template usage

### Monthly Tasks
- [ ] Rotate API credentials
- [ ] Review security logs
- [ ] Update dependencies
- [ ] Backup database
- [ ] Performance review

## License

See LICENSE file in repository root.
