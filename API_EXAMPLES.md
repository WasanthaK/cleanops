# API Examples - Phase 1 Integrations

Quick reference guide with curl examples for all Phase 1 endpoints.

## Authentication

All endpoints require JWT authentication. Get a token first:

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@example.com",
    "password": "password123"
  }'

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": "worker-demo-1",
    "email": "worker@example.com",
    "name": "Demo Worker",
    "role": "cleaner"
  }
}
```

Set token for subsequent requests:
```bash
export TOKEN="your_access_token_here"
```

---

## Xero Integration

### 1. Initiate Xero Connection

Opens OAuth flow in browser:

```bash
curl -X GET "http://localhost:3000/integrations/xero/connect" \
  -H "Authorization: Bearer $TOKEN" \
  -L
```

**Response:** Redirects to Xero authorization page

### 2. Handle OAuth Callback

After user authorizes on Xero, handle the callback:

```bash
curl -X POST http://localhost:3000/integrations/xero/callback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "authorization_code_from_xero",
    "tenantId": "xero-tenant-id"
  }'
```

**Response:**
```json
{
  "success": true,
  "tenantId": "abc123...",
  "tenantName": "My Company",
  "integrationId": "integration-id"
}
```

### 3. Sync Payroll to Xero

Export payroll data for a date range:

```bash
curl -X POST "http://localhost:3000/integrations/xero/sync-payroll/YOUR_TENANT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "workerId": "worker-123"
  }'
```

**Response:**
```json
{
  "success": true,
  "recordsSynced": 15,
  "message": "Payroll synced to Xero successfully"
}
```

### 4. Check Integration Status

View sync history and current status:

```bash
curl -X GET "http://localhost:3000/integrations/xero/status/YOUR_TENANT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "tenantId": "abc123...",
  "syncStatus": "CONNECTED",
  "lastSyncAt": "2024-01-31T10:00:00Z",
  "recentSyncs": [
    {
      "id": "sync-1",
      "syncType": "payroll",
      "status": "success",
      "recordsSynced": 15,
      "createdAt": "2024-01-31T10:00:00Z"
    }
  ]
}
```

### 5. Disconnect Xero

Disable the integration:

```bash
curl -X POST "http://localhost:3000/integrations/xero/disconnect/YOUR_TENANT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Xero integration disconnected"
}
```

---

## Evia Sign Integration

### 1. Send Document for Signing

Generate and send completion report:

```bash
curl -X POST http://localhost:3000/integrations/evia-sign/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "job-demo-1",
    "recipientEmail": "client@example.com",
    "recipientName": "John Smith",
    "documentType": "completion_report"
  }'
```

**Response:**
```json
{
  "success": true,
  "documentId": "doc-123",
  "eviaDocId": "evia_abc123",
  "status": "SENT",
  "recipientEmail": "client@example.com"
}
```

### 2. Check Document Status

Get current signing status:

```bash
curl -X GET "http://localhost:3000/integrations/evia-sign/document/doc-123" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "documentId": "doc-123",
  "eviaDocId": "evia_abc123",
  "status": "SIGNED",
  "documentType": "completion_report",
  "recipientEmail": "client@example.com",
  "recipientName": "John Smith",
  "sentAt": "2024-01-15T09:00:00Z",
  "viewedAt": "2024-01-15T09:05:00Z",
  "signedAt": "2024-01-15T09:10:00Z",
  "signedPdfUrl": "https://example.com/signed/doc-123.pdf",
  "job": {
    "id": "job-demo-1",
    "title": "Weekly Office Clean",
    "site": {
      "name": "Sydney CBD Office"
    }
  }
}
```

### 3. Handle Webhook (Called by Evia Sign)

Webhook endpoint for status updates:

```bash
curl -X POST http://localhost:3000/integrations/evia-sign/webhook/status \
  -H "X-Evia-Signature: signature_from_evia_sign" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "evia_abc123",
    "status": "SIGNED",
    "signedAt": "2024-01-15T09:10:00Z",
    "signedPdfUrl": "https://evia.com/signed.pdf",
    "metadata": {}
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

---

## Job Templates

### 1. List All Templates

Get all active templates:

```bash
curl -X GET http://localhost:3000/templates \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
[
  {
    "id": "template-1",
    "name": "Standard Office Cleaning",
    "category": "commercial",
    "description": "Standard daily office cleaning service",
    "estimatedHours": 2.5,
    "basePrice": 150,
    "active": true,
    "taskTemplates": [
      {
        "id": "task-1",
        "title": "Vacuum all carpeted areas",
        "description": null,
        "estimatedMinutes": 30,
        "required": true,
        "orderIndex": 0
      }
    ]
  }
]
```

### 2. Filter by Category

Get templates for specific category:

```bash
curl -X GET "http://localhost:3000/templates?category=commercial" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Get Template Details

Get specific template:

```bash
curl -X GET http://localhost:3000/templates/template-1 \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "id": "template-1",
  "name": "Standard Office Cleaning",
  "category": "commercial",
  "description": "Standard daily office cleaning service",
  "estimatedHours": 2.5,
  "basePrice": 150,
  "active": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "taskTemplates": [
    {
      "id": "task-1",
      "title": "Vacuum all carpeted areas",
      "estimatedMinutes": 30,
      "required": true,
      "orderIndex": 0
    },
    {
      "id": "task-2",
      "title": "Empty all bins",
      "estimatedMinutes": 15,
      "required": true,
      "orderIndex": 1
    }
  ]
}
```

### 4. Create New Template

Add custom template:

```bash
curl -X POST http://localhost:3000/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Cleaning Service",
    "category": "commercial",
    "description": "Customized cleaning for special requirements",
    "estimatedHours": 3,
    "basePrice": 200,
    "tasks": [
      {
        "title": "Clean reception area",
        "description": "Dust and vacuum reception",
        "estimatedMinutes": 45,
        "required": true,
        "orderIndex": 0
      },
      {
        "title": "Clean meeting rooms",
        "description": "Clean all meeting rooms",
        "estimatedMinutes": 60,
        "required": true,
        "orderIndex": 1
      }
    ]
  }'
```

**Response:**
```json
{
  "id": "new-template-id",
  "name": "Custom Cleaning Service",
  "category": "commercial",
  "description": "Customized cleaning for special requirements",
  "estimatedHours": 3,
  "basePrice": 200,
  "active": true,
  "taskTemplates": [...]
}
```

### 5. Update Template

Modify existing template:

```bash
curl -X PUT http://localhost:3000/templates/template-1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Template Name",
    "estimatedHours": 3.5,
    "basePrice": 180,
    "tasks": [
      {
        "title": "New task",
        "estimatedMinutes": 30,
        "required": true,
        "orderIndex": 0
      }
    ]
  }'
```

### 6. Delete Template (Soft Delete)

Deactivate template:

```bash
curl -X DELETE http://localhost:3000/templates/template-1 \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

### 7. Create Job from Template

Generate job from template:

```bash
curl -X POST http://localhost:3000/templates/template-1/create-job \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "site-demo-1",
    "title": "Weekly Office Clean - Floor 3",
    "scheduledDate": "2024-01-15T09:00:00Z",
    "workerIds": ["worker-demo-1"],
    "description": "Regular weekly cleaning service"
  }'
```

**Response:**
```json
{
  "id": "new-job-id",
  "siteId": "site-demo-1",
  "title": "Weekly Office Clean - Floor 3",
  "description": "Regular weekly cleaning service",
  "scheduledDate": "2024-01-15T09:00:00Z",
  "site": {
    "id": "site-demo-1",
    "name": "Sydney CBD Office",
    "address": "123 Pitt Street, Sydney NSW"
  },
  "assignments": [
    {
      "workerId": "worker-demo-1"
    }
  ],
  "tasks": [
    {
      "title": "Vacuum all carpeted areas",
      "notes": null,
      "completed": false,
      "workerId": "worker-demo-1"
    },
    {
      "title": "Empty all bins",
      "notes": null,
      "completed": false,
      "workerId": "worker-demo-1"
    }
  ]
}
```

### 8. Seed Pre-built Templates

Load default templates:

```bash
curl -X POST http://localhost:3000/templates/seed \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "count": 4
}
```

---

## Common Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal server error |

---

## Error Response Format

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Failed to connect to Xero. Please try again.",
  "error": "Bad Request"
}
```

---

## Tips

### Using Variables

```bash
# Set common variables
export API_URL="http://localhost:3000"
export TOKEN="your_token_here"

# Use in requests
curl -X GET "$API_URL/templates" \
  -H "Authorization: Bearer $TOKEN"
```

### Saving Responses

```bash
# Save response to file
curl -X GET "$API_URL/templates" \
  -H "Authorization: Bearer $TOKEN" \
  > templates.json

# Pretty print JSON
curl -X GET "$API_URL/templates" \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

### Testing Webhooks Locally

Use ngrok to expose local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose port 3000
ngrok http 3000

# Use ngrok URL in webhook configuration
# https://abc123.ngrok.io/integrations/evia-sign/webhook/status
```

---

## Postman Collection

Import this as a Postman collection for easier testing:

1. Create new collection "CleanOps Phase 1"
2. Add environment variables:
   - `baseUrl`: `http://localhost:3000`
   - `token`: Your JWT token
3. Import requests from this guide
4. Use `{{baseUrl}}` and `{{token}}` in requests

---

## Next Steps

1. ✅ Get authentication token
2. ✅ Seed pre-built templates
3. ✅ Test template listing
4. ✅ Create job from template
5. ✅ Configure Xero integration
6. ✅ Test Xero OAuth flow
7. ✅ Send test document via Evia Sign
8. ✅ Check document status

---

## Documentation

- **INTEGRATION_GUIDE.md** - Technical details
- **PHASE1_DEPLOYMENT.md** - Deployment guide
- **PHASE1_SUMMARY.md** - Quick overview
- **HANDOVER.md** - Complete specifications

---

**Happy integrating! 🚀**
