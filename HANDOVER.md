# CleanOps Development Handover Plan

**Project:** CleanOps - Cleaning Services Management Platform  
**Client:** WasanthaK  
**Date:** October 4, 2025  
**Repository:** https://github.com/WasanthaK/cleanops

---

## 🎯 Project Overview

CleanOps is a comprehensive work completion platform for cleaning and field service companies operating in Australia. The system features:

- **Mobile-first design** for field workers with offline capabilities
- **Manager dashboard** for job assignment, monitoring, and reporting
- **Xero integration** for automated accounting and payroll
- **Evia Sign integration** (preferred) for professional digital signatures
- **Australian award compliance** for payroll calculations
- **Progressive Web App (PWA)** for native mobile experience without app stores

---

## 📋 Current System Status

### **Existing Implementation** ✅
The codebase already includes:

1. **Backend (NestJS API)** - packages/api/
   - Authentication & JWT strategy
   - Job management service
   - Attendance tracking (travel, arrive, clock-in/out, breaks)
   - Task management with bulk operations
   - Payroll calculations with Australian award rules
   - Photo upload service (S3/MinIO)
   - Digital sign-off service
   - Incident reporting
   - Offline sync endpoints

2. **Frontend (React PWA)** - packages/web/
   - Progressive Web App setup
   - Offline-first architecture
   - Background sync capabilities
   - Job and task views
   - Signature pad component
   - Photo capture and upload
   - Service worker for offline functionality

3. **Database (PostgreSQL + Prisma)**
   - Complete schema for all entities
   - Migrations in place
   - Seed data for demo

4. **Infrastructure**
   - Docker Compose setup
   - PostgreSQL database
   - MinIO for S3-compatible storage
   - OpenAPI documentation

### **Documentation Available** 📚
All project documentation is committed to the repository:

- **FEATURES.md** - Complete feature specifications
- **USER-GUIDE.md** - Implementation guide and API examples
- **ENHANCEMENT-PLAN.md** - Roadmap and implementation details
- **README.md** - Setup and getting started guide

---

## 🚀 Implementation Priorities

### **Phase 1: Priority Integrations (4-6 weeks)**

#### 1. Xero Accounting Integration (High Priority)

**Objective:** Automate payroll export and invoicing to Xero

**Database Changes Required:**
```typescript
// Add to prisma/schema.prisma

model XeroIntegration {
  id            String   @id @default(cuid())
  tenantId      String   // Xero organisation ID
  accessToken   String   // Encrypted
  refreshToken  String   // Encrypted
  expiresAt     DateTime
  lastSyncAt    DateTime?
  syncStatus    XeroSyncStatus
  payrollMapping Json    // Map pay types to Xero items
  expenseMapping Json
  taxMapping     Json
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum XeroSyncStatus {
  CONNECTED
  SYNCING
  ERROR
  DISCONNECTED
}

model XeroSyncLog {
  id          String   @id @default(cuid())
  integrationId String
  syncType    String   // 'payroll', 'invoice', 'expense'
  status      String   // 'success', 'failed', 'partial'
  recordCount Int
  errorMessage String?
  syncedAt    DateTime @default(now())
}
```

**API Endpoints to Implement:**
```typescript
// packages/api/src/integrations/xero/

// Authentication
POST   /integrations/xero/connect          // Initiate OAuth flow
GET    /integrations/xero/callback         // OAuth callback handler
POST   /integrations/xero/disconnect       // Remove integration
GET    /integrations/xero/status           // Check connection status

// Data Sync
POST   /integrations/xero/sync/payroll     // Export payroll data
POST   /integrations/xero/sync/invoices    // Generate client invoices
POST   /integrations/xero/sync/expenses    // Sync expenses
GET    /integrations/xero/sync/history     // View sync history

// Configuration
GET    /integrations/xero/accounts         // List Xero accounts
POST   /integrations/xero/mapping/payroll  // Configure payroll mapping
POST   /integrations/xero/mapping/expenses // Configure expense mapping
GET    /integrations/xero/employees        // List Xero employees
POST   /integrations/xero/employees/sync   // Sync worker-employee mapping
```

**NPM Packages Required:**
```bash
npm install xero-node
npm install @xero/oauth2
```

**Implementation Checklist:**
- [ ] Install Xero SDK packages
- [ ] Create Xero app in Xero Developer Portal
- [ ] Implement OAuth 2.0 flow with PKCE
- [ ] Create XeroIntegration service
- [ ] Implement token refresh logic
- [ ] Build payroll export functionality
- [ ] Build invoice generation
- [ ] Create admin UI for account mapping
- [ ] Add error handling and retry logic
- [ ] Create sync status monitoring dashboard
- [ ] Write integration tests
- [ ] Document Xero setup process

**Key Considerations:**
- Store tokens encrypted in database
- Implement automatic token refresh
- Handle rate limiting (60 requests/minute for Xero API)
- Map CleanOps pay types to Xero pay items
- Support multiple Xero organizations per account

---

#### 2. Evia Sign Integration (High Priority - Preferred Digital Signature)

**Objective:** Implement professional document signing via Evia Sign as primary method

**Database Changes Required:**
```typescript
// Add to prisma/schema.prisma

model EviaSignDocument {
  id               String   @id @default(cuid())
  jobId            String
  job              Job      @relation(fields: [jobId], references: [id])
  
  eviaDocId        String   @unique // Evia Sign document ID
  templateId       String
  
  recipientEmail   String
  recipientName    String
  recipientRole    String
  
  mobileOptimized  Boolean  @default(true)
  status           EviaSignStatus
  sentAt           DateTime
  viewedAt         DateTime?
  signedAt         DateTime?
  expiresAt        DateTime
  
  pdfUrl           String?  // Signed document URL
  webhookEvents    Json[]   // Audit trail
  
  fallbackUsed     Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

enum EviaSignStatus {
  DRAFT
  SENT
  VIEWED
  SIGNED
  COMPLETED
  EXPIRED
  CANCELLED
  DECLINED
}

model EviaSignTemplate {
  id          String   @id @default(cuid())
  name        String
  eviaTemplateId String
  documentType String  // 'completion_report', 'invoice', 'contract'
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**API Endpoints to Implement:**
```typescript
// packages/api/src/integrations/evia-sign/

// Document Management
POST   /integrations/evia-sign/send              // Send document for signing
GET    /integrations/evia-sign/document/:id      // Get document status
POST   /integrations/evia-sign/document/:id/remind  // Send reminder
POST   /integrations/evia-sign/document/:id/cancel  // Cancel document
GET    /integrations/evia-sign/document/:id/download // Download signed PDF

// Webhooks (for Evia Sign callbacks)
POST   /integrations/evia-sign/webhook/status    // Status update webhook
POST   /integrations/evia-sign/webhook/signed    // Document signed webhook

// Templates
GET    /integrations/evia-sign/templates         // List templates
POST   /integrations/evia-sign/templates         // Upload new template
PUT    /integrations/evia-sign/templates/:id     // Update template
DELETE /integrations/evia-sign/templates/:id     // Remove template

// Job Integration
POST   /jobs/:jobId/signoff/evia-sign           // Send job completion for signing
GET    /jobs/:jobId/signoff/evia-status         // Check signing status
```

**NPM Packages Required:**
```bash
npm install axios  # For API calls if not already installed
npm install pdf-lib  # For PDF generation
npm install handlebars  # For document templating
```

**Implementation Checklist:**
- [ ] Get Evia Sign API credentials
- [ ] Create EviaSignService with API integration
- [ ] Implement PDF generation from job data
- [ ] Create mobile-optimized document templates
- [ ] Implement webhook handlers for status updates
- [ ] Update SignoffService to use Evia Sign as primary
- [ ] Keep mobile signature pad as fallback
- [ ] Add push notifications for signature status
- [ ] Build admin UI for template management
- [ ] Create completion report template (branded)
- [ ] Implement automatic reminder scheduling
- [ ] Add signature status tracking in mobile app
- [ ] Write integration tests
- [ ] Document Evia Sign setup process

**Key Considerations:**
- Mobile-optimized signing experience is critical
- Implement webhook security (verify signatures)
- Store signed PDFs securely in S3
- Track signature events for audit trail
- Set reasonable expiry dates (7 days default)
- Support multiple signatories if needed
- Fallback to on-device signature when offline

---

#### 3. Job Template System (Medium Priority)

**Objective:** Allow managers to create reusable job templates for common cleaning tasks

**Database Changes Required:**
```typescript
// Add to prisma/schema.prisma

model JobTemplate {
  id              String   @id @default(cuid())
  name            String
  category        String   // 'Commercial', 'Residential', 'Specialized'
  description     String?
  
  taskTemplates   TaskTemplate[]
  
  estimatedHours  Float?
  basePrice       Float?
  active          Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
}

model TaskTemplate {
  id              String      @id @default(cuid())
  templateId      String
  template        JobTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  
  title           String
  description     String?
  category        String      // 'Preparation', 'Cleaning', 'Documentation', 'Safety'
  order           Int         // Display order
  required        Boolean     @default(true)
  
  estimatedMinutes Int?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**API Endpoints to Implement:**
```typescript
// packages/api/src/job-templates/

// Template Management
GET    /job-templates                  // List all templates
POST   /job-templates                  // Create new template
GET    /job-templates/:id              // Get template details
PUT    /job-templates/:id              // Update template
DELETE /job-templates/:id              // Delete template
POST   /job-templates/:id/duplicate    // Duplicate template

// Job Creation from Template
POST   /jobs/from-template/:templateId  // Create job from template

// Task Templates
POST   /job-templates/:id/tasks        // Add task to template
PUT    /job-templates/:id/tasks/:taskId  // Update task
DELETE /job-templates/:id/tasks/:taskId  // Remove task
POST   /job-templates/:id/tasks/reorder // Reorder tasks
```

**Pre-built Templates to Create:**

1. **Steam Cleaning Package**
   - Safety and equipment check
   - Area preparation and protection
   - Steam cleaning equipment setup
   - Wall steam cleaning
   - Carpet steam cleaning
   - Upholstery treatment
   - Final inspection and cleanup

2. **Apartment Deep Clean Package**
   - Initial walkthrough and assessment
   - Bathroom deep clean
   - Kitchen deep clean
   - Living areas cleaning
   - Bedroom cleaning
   - Window cleaning (interior)
   - Final inspection and client walkthrough

3. **Office Building Cleaning Package**
   - Reception and common areas
   - Office desks and workstations
   - Meeting rooms
   - Kitchen/break rooms
   - Restrooms
   - Floors and carpets
   - Waste disposal

**Implementation Checklist:**
- [ ] Create JobTemplate and TaskTemplate models
- [ ] Run database migration
- [ ] Implement JobTemplatesService
- [ ] Create API endpoints
- [ ] Build manager UI for template creation
- [ ] Add template selection during job creation
- [ ] Create pre-built templates (seed data)
- [ ] Add template search and filtering
- [ ] Implement task reordering functionality
- [ ] Add template usage analytics
- [ ] Write unit tests
- [ ] Update documentation

---

### **Phase 2: Enhanced Features (8-12 weeks)**

#### 4. Manager Dashboard Enhancements

**Features to Implement:**
- Real-time job monitoring with live updates
- Worker location tracking on map view
- Performance analytics and KPIs
- Financial reporting dashboard
- Job completion time analysis
- Worker efficiency metrics

**API Endpoints:**
```typescript
GET /analytics/dashboard           // Overall dashboard data
GET /analytics/workers/:id         // Worker performance
GET /analytics/jobs/completion     // Job completion rates
GET /analytics/financial/summary   // Financial overview
GET /analytics/timeline            // Timeline view of all jobs
```

**Technology Stack:**
- WebSocket integration for real-time updates
- Chart.js or Recharts for visualizations
- Google Maps API for location tracking
- Server-Sent Events for live job status

---

#### 5. Quality Assurance System

**Database Changes:**
```typescript
model QualityChecklist {
  id           String   @id @default(cuid())
  jobId        String
  workerId     String
  items        QualityCheckItem[]
  overallScore Float
  supervisorId String?
  completedAt  DateTime
}

model QualityCheckItem {
  id          String  @id @default(cuid())
  checklistId String
  category    String
  description String
  passed      Boolean
  score       Int     // 1-5 rating
  notes       String?
  photoKeys   String[] // S3 keys for evidence photos
}
```

**Features:**
- Standardized quality checklists per job type
- Photo requirements for verification
- Supervisor review workflows
- Quality scoring and reporting

---

#### 6. Client Portal (Optional Enhancement)

**Features:**
- View job history and upcoming services
- Download completion reports
- Access before/after photos
- Rate service quality
- Request additional services
- Manage access instructions

---

### **Phase 3: Mobile App Enhancements (Ongoing)**

**Priority Features:**
1. **Enhanced Photo Management**
   - Automatic photo categorization
   - Image compression before upload
   - Batch photo upload
   - Photo annotation

2. **Voice Features**
   - Voice-to-text for task notes
   - Audio incident reports
   - Hands-free task updates

3. **Offline Optimization**
   - Improved sync conflict resolution
   - Better progress indicators
   - Larger offline storage capacity
   - Smart sync prioritization

4. **Push Notifications**
   - Job assignment alerts
   - Evia Sign status updates
   - Shift reminders
   - Emergency notifications

---

## 🛠️ Technical Implementation Guidelines

### **Architecture Principles**

1. **Offline-First for Workers**
   - All worker operations must function offline
   - Queue all actions for sync
   - Handle sync conflicts gracefully

2. **Online for Managers**
   - Real-time dashboard updates
   - Immediate data access
   - Live notifications

3. **Security**
   - JWT authentication for all endpoints
   - Encrypted storage for sensitive data (tokens, signatures)
   - HTTPS only in production
   - Rate limiting on all APIs

4. **Performance**
   - Database query optimization
   - Image compression (reduce photo sizes)
   - Lazy loading for mobile app
   - Caching strategies

5. **Error Handling**
   - Graceful degradation for offline scenarios
   - Retry logic for failed sync operations
   - User-friendly error messages
   - Comprehensive logging

---

## 📦 Development Environment Setup

### **Prerequisites**
```bash
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose v2
- PostgreSQL 15 (via Docker)
- MinIO (via Docker)
```

### **Quick Start**
```bash
# Clone repository
git clone https://github.com/WasanthaK/cleanops.git
cd cleanops

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start services via Docker
docker compose up -d

# Run migrations
cd packages/api
pnpm prisma migrate deploy
pnpm prisma db seed

# Start API (Terminal 1)
cd packages/api
pnpm run start:dev

# Start Web (Terminal 2)
cd packages/web
pnpm run dev
```

### **Access Points**
- **Web App:** http://localhost:5173
- **API:** http://localhost:3000
- **API Docs:** http://localhost:3000/docs
- **MinIO Console:** http://localhost:9001

---

## 🔐 Required API Keys & Credentials

### **Xero Integration**
1. Create app at https://developer.xero.com/
2. Get Client ID and Client Secret
3. Set redirect URI: `http://localhost:3000/integrations/xero/callback`
4. Add to .env:
   ```
   XERO_CLIENT_ID=your_client_id
   XERO_CLIENT_SECRET=your_client_secret
   XERO_REDIRECT_URI=http://localhost:3000/integrations/xero/callback
   ```

### **Evia Sign Integration**
1. Register at Evia Sign platform
2. Get API Key and Secret
3. Configure webhook URL: `http://your-domain.com/integrations/evia-sign/webhook/status`
4. Add to .env:
   ```
   EVIA_SIGN_API_KEY=your_api_key
   EVIA_SIGN_API_SECRET=your_api_secret
   EVIA_SIGN_WEBHOOK_SECRET=your_webhook_secret
   EVIA_SIGN_API_URL=https://api.eviasign.com
   ```

### **AWS S3 / MinIO**
Already configured in docker-compose.yml for local development.
For production:
```
S3_ENDPOINT=your_s3_endpoint
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_BUCKET=cleanops-photos
```

---

## 🧪 Testing Strategy

### **Unit Tests**
- All services should have unit tests
- Target: 80% code coverage
- Focus on business logic (payroll calculations, award rules)

### **Integration Tests**
- Test Xero API integration
- Test Evia Sign workflows
- Test offline sync functionality

### **E2E Tests**
- Worker job completion workflow
- Manager job creation and assignment
- Client sign-off process

### **Testing Commands**
```bash
# API tests
cd packages/api
pnpm test

# Web tests
cd packages/web
pnpm test

# E2E tests (if implemented)
pnpm test:e2e
```

---

## 📊 Success Metrics

### **Technical Metrics**
- [ ] API response time < 500ms (P95)
- [ ] Mobile app offline functionality 100% operational
- [ ] Sync success rate > 99%
- [ ] Zero data loss during sync conflicts
- [ ] 80% test coverage

### **Business Metrics**
- [ ] Time to create job < 2 minutes
- [ ] Worker can complete job offline
- [ ] Client sign-off time < 5 minutes
- [ ] Payroll export to Xero < 1 minute
- [ ] Manager dashboard loads in < 2 seconds

### **Compliance Metrics**
- [ ] Australian award calculations 100% accurate
- [ ] ATO STP compliance via Xero
- [ ] 7-year data retention implemented
- [ ] Audit trail for all signatures
- [ ] HTTPS encryption in production

---

## 🚨 Known Issues & Considerations

### **Current System**
1. **Sync Conflicts:** Need robust conflict resolution for offline edits
2. **Photo Storage:** Large photos may cause slow uploads - implement compression
3. **Real-time Updates:** WebSocket not yet implemented for live dashboard
4. **Award Rules:** Currently stub implementation - verify accuracy with Australian Fair Work regulations

### **Integration Considerations**
1. **Xero Rate Limits:** 60 requests/minute - implement queuing
2. **Evia Sign Webhook Security:** Must verify webhook signatures
3. **Mobile Signature Fallback:** Ensure seamless fallback when Evia Sign unavailable
4. **Timezone Handling:** Australia has multiple timezones - ensure correct handling

---

## 📚 Documentation Links

- **Features:** See FEATURES.md for complete feature specifications
- **User Guide:** See USER-GUIDE.md for API examples and workflows
- **Enhancement Plan:** See ENHANCEMENT-PLAN.md for detailed implementation guidance
- **API Documentation:** http://localhost:3000/docs (when running)
- **OpenAPI Spec:** infra/openapi/openapi.yaml

---

## 🔄 Deployment Process

### **Staging Environment**
1. Deploy to staging environment
2. Run full test suite
3. Manual QA testing
4. Load testing
5. Security scan

### **Production Deployment**
1. Database backup
2. Run migrations
3. Deploy API (zero-downtime)
4. Deploy Web (PWA update)
5. Verify integrations (Xero, Evia Sign)
6. Monitor logs and metrics

### **Rollback Plan**
- Keep previous Docker images
- Database rollback scripts
- Feature flags for new functionality

---

## 👥 Key Stakeholders

- **Client:** WasanthaK
- **Repository:** https://github.com/WasanthaK/cleanops
- **Technology Stack:** NestJS, React, PostgreSQL, Prisma, Docker
- **Target Market:** Australian cleaning services companies

---

## 📞 Support & Questions

All documentation is in the repository. Key files:
- **FEATURES.md** - What to build
- **USER-GUIDE.md** - How it works
- **ENHANCEMENT-PLAN.md** - Implementation details
- **README.md** - Getting started

For questions about requirements, refer to the documentation files first.

---

## ✅ Final Checklist Before Starting

- [ ] Read all documentation files (FEATURES.md, USER-GUIDE.md, ENHANCEMENT-PLAN.md)
- [ ] Set up development environment
- [ ] Run existing system to understand current state
- [ ] Get Xero developer account and credentials
- [ ] Get Evia Sign API access
- [ ] Review Australian award rules for payroll
- [ ] Understand mobile-first design requirements
- [ ] Review offline-first architecture patterns
- [ ] Plan sprint breakdown for Phase 1
- [ ] Set up CI/CD pipeline

---

## 🎯 Priority Order

**Week 1-2:**
1. Set up development environment
2. Review existing codebase
3. Get Xero and Evia Sign credentials
4. Plan database migrations

**Week 3-4:**
5. Implement Xero OAuth flow
6. Implement basic payroll export

**Week 5-6:**
7. Implement Evia Sign integration
8. Create document templates
9. Test mobile signature workflow

**Week 7-8:**
10. Implement Job Template system
11. Create pre-built templates
12. Build template UI

---

**This handover plan provides complete guidance for implementing CleanOps. All technical specifications, business requirements, and implementation details are documented in the repository files.**

**Good luck with the implementation! 🚀**