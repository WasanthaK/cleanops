# CleanOps User Guide

## System Overview: Online vs Offline Operations

**CleanOps is designed with two distinct operational modes:**

### 🏢 **Managers & Office Staff - Online Operations**
- Operate from office environments with reliable internet
- Real-time job creation, assignment, and monitoring
- Live dashboard with current job statuses and worker locations
- Im### Mobile App Usage (Mobile-First Design)

### Offline Functionality for Mobile Field Workers

The CleanOps mobile app is mobile-first, optimized for smartphones and tablets used by field workers in areas with poor or no internet connectivity:te access to payroll, reporting, and analytics
- **Requires internet connection for all functionality**

### 🚐 **Field Workers - Offline-First Operations**  
- Designed for cleaning sites with poor/no internet connectivity
- Download jobs and instructions when connected (office, depot, WiFi)
- Work completely offline for hours or days
- All features work without internet: time tracking, photos, task completion
- Automatic sync when connection returns (end of day, WiFi, cellular signal)
- **No internet required during actual cleaning work**

This design ensures workers can focus on cleaning without connectivity concerns, while managers maintain full oversight and control from the office.

---

## For Managers and Business Owners (Office-Based Operations)

*Note: Manager functions are designed for office environments with reliable internet connectivity. All management features require online access for real-time coordination and data management.*

### Setting Up Jobs and Assignments

#### 1. Creating a New Cleaning Job

```bash
# Example: Creating a steam cleaning job
POST /jobs
{
  "title": "Steam Cleaning - Office Building Level 12",
  "description": "Complete steam cleaning of walls, carpets, and upholstery",
  "siteId": "site_123",
  "scheduledDate": "2024-10-05T09:00:00+10:00"
}
```

#### 2. Assigning Workers to Jobs

```bash
# Assign a team to the job
POST /jobs/{jobId}/assignments
{
  "workerIds": ["worker_001", "worker_002"],
  "specialInstructions": "Focus on conference rooms first"
}
```

#### 3. Setting Up Task Templates

**Steam Cleaning Template:**
- Pre-work safety check
- Equipment setup and testing
- Area preparation and protection
- Steam cleaning of carpets (Room 1-5)
- Steam cleaning of upholstery
- Wall cleaning and sanitization
- Final inspection and cleanup
- Client walkthrough

**Apartment Cleaning Template:**
- Initial site assessment
- Bathroom deep clean
- Kitchen deep clean
- Living areas vacuuming and mopping
- Bedroom cleaning
- Window cleaning (interior)
- Final inspection
- Photo documentation

### Monitoring Work Progress

#### Real-time Job Tracking Dashboard

**View Active Jobs:**
```bash
GET /jobs?status=active
```

**Monitor Specific Job Progress:**
```bash
GET /jobs/{jobId}
# Returns:
# - Current worker locations
# - Task completion status
# - Time spent so far
# - Photos uploaded
# - Any incidents reported
```

#### Time and Performance Analytics

**Generate Time Reports:**
```bash
GET /attendance/reports?from=2024-10-01&to=2024-10-31
# Returns detailed time breakdown:
# - Travel time per job
# - Work time per job  
# - Break time
# - Overtime hours
# - Efficiency metrics
```

### Payroll Management

#### Automatic Payroll Calculation with Xero Integration

```bash
# Generate payroll for a completed job
POST /payroll/{jobId}/draft
{
  "days": [
    {
      "date": "2024-10-05",
      "dayType": "WEEKDAY", 
      "hours": 8.5,
      "baseRate": 25.50
    }
  ],
  "timezone": "Australia/Sydney"
}

# Returns:
{
  "totalHours": 8.5,
  "totalPay": 242.25,
  "breakdown": {
    "regularTime": 216.75,
    "overtime": 25.50
  }
}

# Export to Xero for seamless accounting
POST /payroll/export/xero
{
  "payrollPeriod": "2024-10-01_to_2024-10-07",
  "workerIds": ["worker_001", "worker_002"],
  "includeTimesheets": true,
  "includeExpenses": true
}

# Returns:
{
  "xeroTransactionId": "xero_12345",
  "status": "exported",
  "itemsExported": {
    "timesheets": 12,
    "payrollEntries": 5, 
    "expenses": 3
  }
}
```

#### Australian Award Compliance with Xero Integration

The system automatically applies Australian cleaning industry awards:
- **Casual Loading**: 25% for casual employees
- **Overtime Rates**: 1.5x after 38 hours/week, 2x after 10 hours/day  
- **Weekend Penalties**: Saturday 1.5x, Sunday 2x
- **Public Holiday**: 2.5x base rate
- **Travel Time**: Paid travel time at standard rate
- **Xero Sync**: All award calculations sync to Xero with correct pay categories
- **STP Compliance**: Automatic Single Touch Payroll reporting via Xero
- **ATO Integration**: Seamless tax reporting through Xero's ATO connection

### Client Reporting and Sign-off

#### Generating Completion Reports

```bash
# Get comprehensive job completion report
GET /jobs/{jobId}/completion-report

# Includes:
# - All completed tasks with timestamps
# - Before and after photos
# - Total time spent
# - Worker signatures
# - Client sign-off
# - Any incidents or notes
```

## For Workers (Mobile-First Field Operations - Offline Capable)

*Note: Worker interface is mobile-first, designed for smartphones and tablets in field environments. All features work completely offline and sync automatically when connectivity is available. Evia Sign integration provides professional document signing when internet is available.*

### Getting Started on a Job

#### 1. Clock In for Travel
```javascript
// Start travel tracking
fetch('/attendance/{jobId}/travel-start', {
  method: 'POST',
  body: JSON.stringify({
    occurredAt: new Date().toISOString(),
    coordinates: [latitude, longitude],
    note: "Departing from depot"
  })
});
```

#### 2. Arrive at Site
```javascript
// Log arrival
fetch('/attendance/{jobId}/arrive', {
  method: 'POST',
  body: JSON.stringify({
    occurredAt: new Date().toISOString(),
    coordinates: [latitude, longitude],
    note: "Arrived at client site"
  })
});
```

#### 3. Begin Work
```javascript
// Clock in for actual work
fetch('/attendance/{jobId}/clock-in', {
  method: 'POST',
  body: JSON.stringify({
    occurredAt: new Date().toISOString(),
    coordinates: [latitude, longitude]
  })
});
```

### Completing Preparation Tasks

#### Safety and Site Assessment

1. **Safety Checklist:**
   - Personal protective equipment check
   - Equipment inspection
   - Site hazard assessment
   - Emergency procedure review

2. **Initial Site Photos:**
```javascript
// Upload before photos
fetch('/photos/{jobId}', {
  method: 'POST',
  body: formData // Contains photo file
});
```

3. **Equipment Setup:**
   - Steam cleaning equipment setup
   - Chemical preparation and safety
   - Area protection and preparation

### Task Completion Workflow

#### 1. View Assigned Tasks
```bash
GET /jobs/{jobId}/tasks
# Returns list of tasks assigned to the job
```

#### 2. Complete Tasks with Documentation
```javascript
// Update task completion
fetch('/tasks/{jobId}/bulk', {
  method: 'POST',
  body: JSON.stringify({
    tasks: [
      {
        id: "task_001",
        title: "Steam clean conference room carpet",
        completed: true,
        notes: "Removed coffee stains, applied stain protection"
      }
    ]
  })
});
```

#### 3. Document Work Progress
- Take progress photos during work
- Add detailed notes for each completed task
- Report any issues or obstacles encountered
- Update estimated completion time

### Final Documentation and Sign-off

#### 1. Completion Photography
```javascript
// Upload after photos
fetch('/photos/{jobId}', {
  method: 'POST',
  body: JSON.stringify({
    kind: "AFTER",
    objectKey: "job_123_after_001.jpg",
    note: "Conference room after steam cleaning"
  })
});
```

#### 2. Client Sign-off Process

**Primary Method: Evia Sign Integration (Recommended)**
```javascript
// Mobile-optimized Evia Sign workflow - primary signature method
fetch('/signoff/{jobId}/evia-sign', {
  method: 'POST',
  body: JSON.stringify({
    clientEmail: "sarah.johnson@company.com.au",
    clientName: "Sarah Johnson",
    clientRole: "Facilities Manager",
    documentTemplate: "completion_report_template",
    sendReminders: true,
    expiryDays: 7,
    mobileOptimized: true  // Ensures mobile-friendly signing experience
  })
});

// Check signing status from mobile app
fetch('/signoff/{jobId}/evia-status', {
  method: 'GET'
});
// Returns: { status: "pending|signed|expired", signedAt: "timestamp" }
```

**Fallback Method: On-site Mobile Signature Pad**
```javascript
// Backup option when Evia Sign not suitable (poor internet, immediate signature needed)
fetch('/signoff/{jobId}', {
  method: 'POST',
  body: JSON.stringify({
    clientName: "Sarah Johnson",
    clientRole: "Facilities Manager", 
    signedAt: new Date().toISOString(),
    signatureKey: "signature_image_key.png",
    signatureMethod: "mobile_capture"  // Track signature method used
  })
});
```

#### 3. Final Clock Out
```javascript
// End work shift
fetch('/attendance/{jobId}/clock-out', {
  method: 'POST',
  body: JSON.stringify({
    occurredAt: new Date().toISOString(),
    coordinates: [latitude, longitude],
    note: "Job completed, client signed off"
  })
});
```

### Personal Performance Tracking

#### View Your Performance
```bash
GET /workers/{workerId}/performance
# Returns:
# - Jobs completed this month
# - Average completion time
# - Quality ratings
# - Overtime hours
# - Efficiency metrics
```

#### Track Your Earnings
```bash
GET /workers/{workerId}/payroll
# Shows:
# - Current period earnings
# - Breakdown by job
# - Overtime calculations
# - Estimated take-home pay
```

## Mobile App Usage

### Offline Functionality for Field Workers

The CleanOps mobile app is specifically designed for field workers who need to operate in areas with poor or no internet connectivity:

1. **Download Jobs**: Jobs and tasks sync automatically when online (before leaving office/depot)
2. **Work Completely Offline**: Complete all tasks, take photos, record time without any internet connection
3. **Automatic Sync**: Data uploads automatically when connection restored (return to office, find WiFi, or cellular signal)
4. **GPS Tracking**: Location tracking works offline using device GPS - no data connection required
5. **Extended Offline Periods**: Can work for days offline without any functionality loss
6. **Manager Updates**: Managers see progress updates when workers sync, not real-time during offline periods

### Photo Management

#### Best Practices for Photos:
- **Before Photos**: Capture overall area condition
- **During Photos**: Document process and any issues
- **After Photos**: Show completed work and results
- **Detail Shots**: Close-ups of specific cleaning results

#### Mobile Photo Requirements:
- Minimum resolution: 1080p (optimized for mobile cameras)
- Include timestamp and location
- Clear, well-lit images
- Multiple angles for large areas
- Touch-to-focus for sharp images
- Mobile-optimized compression for faster upload

### Battery and Data Management for Field Workers

- **Battery Optimization**: App designed for all-day battery life during offline operation
- **Data Usage**: Minimal data usage, photos upload on WiFi by default to conserve mobile data
- **Background Sync**: Continues syncing even when app is closed (when connected)
- **Offline Storage**: Up to 50MB local storage for extended offline operations
- **Smart Sync**: Prioritizes critical data first when connection becomes available
- **Data Conservation**: Managers work online, workers sync when convenient/connected

## Common Workflows

### Daily Cleaning Route

1. **Morning Setup**
   - Review assigned jobs for the day
   - Check equipment and supplies
   - Plan optimal route between sites

2. **Each Job Site**
   - Clock in for travel
   - Arrive and assess site
   - Complete safety checklist
   - Take before photos
   - Execute cleaning tasks
   - Document completion with photos
   - Get client sign-off
   - Clock out and travel to next site

3. **End of Day**
   - Review completed jobs
   - Submit any incident reports
   - Check payroll calculations
   - Sync all offline data

### Weekly Maintenance Contracts

1. **Consistent Quality**
   - Use standard task templates
   - Follow same completion checklist
   - Maintain photo documentation standards
   - Track time for accurate billing

2. **Client Relationship**
   - Regular communication through app notes
   - Consistent reporting format
   - Address issues promptly
   - Maintain professional documentation

## Troubleshooting

### Common Issues and Solutions

**App Won't Sync Data:**
- Check internet connection
- Force close and reopen app
- Check available storage space

**GPS Not Working:**
- Enable location permissions
- Ensure GPS is enabled on device
- Try outdoor location for better signal

**Photos Not Uploading:**
- Check WiFi connection
- Verify sufficient storage space
- Ensure photos are not corrupted

**Tasks Not Updating:**
- Complete tasks in order
- Save each task before moving to next
- Check for unsaved changes

### Support Contacts

- **Technical Issues**: support@cleanops.com.au
- **Payroll Questions**: payroll@cleanops.com.au  
- **Emergency Support**: 1800-CLEANOPS

### System Status

Check system status and maintenance schedules at: status.cleanops.com.au