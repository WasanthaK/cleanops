# Phase 1 Deployment Checklist

This checklist guides you through deploying the Phase 1 integrations (Xero, Evia Sign, and Job Templates).

## ✅ Pre-Deployment Verification

### 1. Code Verification
- [x] All integration modules created (Xero, Evia Sign, Templates)
- [x] All controllers implemented with proper API endpoints
- [x] All services implemented with business logic
- [x] All DTOs created with validation
- [x] All modules wired into app.module.ts
- [x] Database schema updated with Phase 1 models
- [x] Test suites created for all integrations
- [x] Documentation created (5 files, 40KB+)

### 2. Dependencies Check
- [x] xero-node installed (^13.1.0)
- [x] pdf-lib installed (^1.17.1)
- [x] handlebars installed (^4.7.8)
- [x] All other dependencies up to date

## 🚀 Deployment Steps

### Step 1: Install Dependencies (5 minutes)

```bash
cd /home/runner/work/cleanops/cleanops
pnpm install
```

**Expected Output:**
- All packages installed successfully
- No peer dependency warnings
- Prisma binaries downloaded (or use manual migration)

### Step 2: Database Migration (10 minutes)

#### Option A: Using Prisma Migrate (Recommended)

```bash
cd infra/prisma

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name add_phase1_integrations

# Verify migration
npx prisma migrate status
```

#### Option B: Manual Migration (If Prisma binaries unavailable)

```bash
cd infra/prisma

# Connect to your PostgreSQL database
psql $DATABASE_URL

# Run the Phase 1 migration
\i migrations/add_phase1_integrations.sql

# Verify tables exist
\dt

# Should show:
# - XeroIntegration
# - XeroSyncLog
# - EviaSignDocument
# - EviaSignTemplate
# - JobTemplate
# - TaskTemplate
```

### Step 3: Environment Configuration (15 minutes)

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the following variables:

#### Required for Xero Integration:
```env
# Get these from https://developer.xero.com
XERO_CLIENT_ID=your_actual_xero_client_id
XERO_CLIENT_SECRET=your_actual_xero_client_secret
XERO_REDIRECT_URI=http://localhost:3000/integrations/xero/callback

# Generate a secure 32-character key
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

**To create Xero OAuth app:**
1. Go to https://developer.xero.com/app/manage
2. Click "New app"
3. App name: "CleanOps Integration"
4. Redirect URI: `http://localhost:3000/integrations/xero/callback`
5. Scopes: Select:
   - accounting.transactions
   - payroll.employees
   - payroll.timesheets
6. Copy Client ID and Secret to `.env`

#### Optional for Evia Sign Integration (works with mocks):
```env
# Contact Evia Sign for API access
EVIA_SIGN_API_KEY=your_evia_sign_api_key
EVIA_SIGN_API_URL=https://api.eviasign.com/v1
EVIA_SIGN_WEBHOOK_SECRET=your_evia_sign_webhook_secret
```

**Note:** If you don't configure Evia Sign credentials, the integration will use mock data for development.

#### Generate Encryption Key:
```bash
# Generate a secure 32-character encryption key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Step 4: Start Services (5 minutes)

```bash
# Start database and dependencies
docker-compose up -d

# Wait for services to be ready
sleep 10

# Start API server
cd packages/api
pnpm dev
```

**Verify API is running:**
- Open http://localhost:3000/api
- You should see Swagger documentation
- New endpoints should be visible:
  - `/integrations/xero/*`
  - `/integrations/evia-sign/*`
  - `/templates/*`

### Step 5: Seed Pre-built Templates (2 minutes)

```bash
# Get a JWT token first (login via API)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@example.com",
    "password": "password123"
  }'

# Use the token to seed templates
curl -X POST http://localhost:3000/templates/seed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Output:**
```json
{
  "success": true,
  "message": "Pre-built templates seeded successfully",
  "count": 4,
  "templates": [
    { "name": "Standard Office Cleaning", "category": "commercial" },
    { "name": "Residential Deep Clean", "category": "residential" },
    { "name": "Window Cleaning Service", "category": "specialized" },
    { "name": "Post-Construction Clean", "category": "specialized" }
  ]
}
```

### Step 6: Test Xero Integration (10 minutes)

```bash
# 1. Get Xero OAuth consent URL
curl http://localhost:3000/integrations/xero/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Open the returned URL in browser
# 3. Authorize the app with your Xero account
# 4. You'll be redirected to callback URL with a code

# 5. Complete the connection (code from callback)
curl -X POST http://localhost:3000/integrations/xero/callback \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "AUTHORIZATION_CODE_FROM_CALLBACK"
  }'

# 6. Check integration status
curl http://localhost:3000/integrations/xero/status/YOUR_TENANT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: syncStatus should be "CONNECTED"
```

### Step 7: Test Template System (5 minutes)

```bash
# 1. List all templates
curl http://localhost:3000/templates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Get a specific template
curl http://localhost:3000/templates/TEMPLATE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Create a job from template
curl -X POST http://localhost:3000/templates/TEMPLATE_ID/create-job \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "site-demo-1",
    "title": "Weekly Office Clean - Building A",
    "scheduledDate": "2024-01-15T09:00:00Z",
    "workerIds": ["worker-demo-1"]
  }'

# Expected: Job created with tasks from template
```

### Step 8: Test Evia Sign Integration (5 minutes)

```bash
# 1. Send a document for signing
curl -X POST http://localhost:3000/integrations/evia-sign/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "job-demo-1",
    "recipientEmail": "client@example.com",
    "recipientName": "John Client",
    "documentType": "completion_report"
  }'

# 2. Check document status
curl http://localhost:3000/integrations/evia-sign/document/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: Document status and details returned
```

### Step 9: Run Tests (10 minutes)

```bash
cd packages/api

# Run all tests
pnpm test

# Run specific test suites
pnpm test xero.service.spec.ts
pnpm test evia-sign.service.spec.ts
pnpm test templates.service.spec.ts
```

**Expected Results:**
- All test suites pass
- No errors or warnings
- Test coverage > 80% for new code

## 🔍 Post-Deployment Verification

### 1. Database Verification
```bash
# Connect to database
psql $DATABASE_URL

# Verify tables exist
\dt

# Check XeroIntegration table
SELECT * FROM "XeroIntegration" LIMIT 5;

# Check JobTemplate table
SELECT * FROM "JobTemplate" LIMIT 5;

# Check EviaSignDocument table
SELECT * FROM "EviaSignDocument" LIMIT 5;
```

### 2. API Endpoints Verification
- [ ] All 14 new endpoints visible in Swagger UI
- [ ] All endpoints require authentication
- [ ] DTOs validate input correctly
- [ ] Error messages are user-friendly

### 3. Integration Testing
- [ ] Xero OAuth flow completes successfully
- [ ] Xero tokens refresh automatically
- [ ] Payroll sync creates log entries
- [ ] Evia Sign document creation works
- [ ] PDF generation is correct
- [ ] Webhook handling updates document status
- [ ] Templates list and filter correctly
- [ ] Jobs created from templates work
- [ ] Pre-built templates seed correctly

### 4. Security Verification
- [ ] Xero tokens encrypted in database
- [ ] Webhook signatures verified
- [ ] No secrets in logs or error messages
- [ ] All endpoints require authentication
- [ ] Environment variables not committed to git

## 🐛 Troubleshooting

### Issue: Prisma binaries not downloading
**Solution:**
- Use manual migration: `psql $DATABASE_URL -f infra/prisma/migrations/add_phase1_integrations.sql`
- Or download binaries manually from Prisma releases

### Issue: Xero OAuth fails
**Solution:**
- Verify Client ID and Secret in `.env`
- Check redirect URI matches exactly
- Ensure scopes are correct in Xero app settings

### Issue: Tests fail
**Solution:**
- Check if Prisma client is generated: `npx prisma generate`
- Verify all dependencies installed: `pnpm install`
- Check database connection

### Issue: Templates not seeding
**Solution:**
- Verify JWT token is valid
- Check if database migration ran successfully
- Look for errors in API logs

## 📊 Success Metrics

After deployment, verify these metrics:

### API Response Times
- [ ] GET /templates < 200ms
- [ ] POST /templates/:id/create-job < 500ms
- [ ] GET /integrations/xero/status/:tenantId < 300ms
- [ ] POST /integrations/evia-sign/send < 1000ms

### Database Performance
- [ ] Template listing query < 100ms
- [ ] Job creation from template < 500ms
- [ ] Xero sync log insertion < 50ms

### Security
- [ ] No plaintext tokens in database
- [ ] All API endpoints require authentication
- [ ] Webhook signatures validated
- [ ] Error messages don't expose sensitive data

## 🎯 Next Steps After Deployment

### Immediate (Week 1)
1. Monitor API logs for errors
2. Test Xero token refresh (after 30 minutes)
3. Test all endpoints with real data
4. Create additional templates as needed
5. Train users on new features

### Short-term (Weeks 2-4)
1. Implement actual Xero payroll API calls
2. Integrate real Evia Sign API (if credentials available)
3. Add rate limiting middleware
4. Update OpenAPI documentation
5. Create UI components for managers
6. Add monitoring and alerts

### Medium-term (Months 2-3)
1. Performance optimization
2. Load testing
3. Security audit
4. User acceptance testing
5. Production deployment
6. Mobile app integration

## 📝 Documentation

Comprehensive documentation available:
- **INTEGRATION_GUIDE.md** - Technical documentation
- **PHASE1_DEPLOYMENT.md** - Detailed deployment guide
- **PHASE1_SUMMARY.md** - Quick overview
- **API_EXAMPLES.md** - curl examples for all endpoints
- **HANDOVER.md** - Complete specifications
- **IMPLEMENTATION_COMPLETE.md** - Implementation summary

## ✅ Deployment Complete!

Once all steps are completed and verified:
- [x] Phase 1 integrations deployed
- [x] All tests passing
- [x] API endpoints functional
- [x] Documentation reviewed
- [x] Users can start using new features

**Congratulations! Phase 1 is now live! 🚀**
