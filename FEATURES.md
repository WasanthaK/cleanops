# CleanOps - Cleaning Services Management System

## Overview

CleanOps is a comprehensive work completion platform specifically designed for cleaning and field service companies operating in Australia. It provides complete offline-capable functionality for managing work assignments, tracking progress, calculating payroll, and generating completion reports.

## Manager/Owner Capabilities

### 1. Work Assignment & Task Management

#### Job Assignment
- **Create Jobs**: Assign work to staff/teams with scheduled dates and site details
- **Job Templates**: Create reusable job templates for common cleaning tasks:
  - Steam cleaning of walls
  - Apartment cleaning
  - Commercial office cleaning
  - Deep cleaning services
  - Maintenance cleaning
- **Staff Assignment**: Assign multiple workers to jobs through the JobAssignment system
- **Site Management**: Manage client sites with addresses and timezone information

#### Task Templates & Assignment
The system supports flexible task creation and assignment:
- Create task templates for different cleaning types
- Assign specific tasks to jobs
- Track task completion status
- Add notes and special instructions

**API Endpoints:**
- `GET /jobs` - List all jobs (manager view)
- `POST /jobs/{jobId}/assignments` - Assign workers to jobs
- `POST /jobs/{jobId}/tasks/bulk` - Bulk assign tasks to jobs

### 2. Progress Tracking & Monitoring

#### Real-time Progress Monitoring (Manager Dashboard)
- **Job Status**: Track overall job completion status from office dashboard
- **Task Completion**: Monitor individual task completion when workers sync data
- **Worker Location**: GPS tracking for arrival and departure (updated when online)
- **Time Tracking**: Monitor time spent on each job phase:
  - Travel time to location
  - Arrival time
  - Clock-in/out times
  - Break times
  - Total work duration
- **Offline Tolerance**: System handles workers being offline for extended periods
- **Sync Notifications**: Managers receive updates when worker data syncs

#### Performance Metrics
- **Time Analysis**: View detailed time breakdowns per job
- **Completion Rates**: Track task and job completion rates
- **Worker Performance**: Individual worker productivity metrics
- **Site-specific Analytics**: Performance data per client site

**API Endpoints:**
- `GET /jobs/{jobId}` - Get detailed job progress including tasks, attendance, photos
- `GET /attendance/reports` - Generate attendance and time reports
- `GET /jobs/{jobId}/progress` - Real-time progress tracking

### 3. Payroll & Salary Calculation

#### Australian Award Compliance
The system includes built-in Australian award calculations:
- **Base Rates**: Configure standard hourly rates
- **Overtime Calculation**: Automatic overtime calculation based on Australian standards
- **Public Holiday Rates**: Enhanced rates for public holidays
- **Weekend Rates**: Saturday and Sunday rate adjustments
- **Travel Time**: Compensation for travel time
- **Xero Integration**: Direct export to Xero for seamless accounting workflows

#### Payroll Features
- **Automatic Calculation**: Real-time payroll calculation based on attendance records
- **Breakdown Reports**: Detailed breakdown of regular time, overtime, and penalties
- **Multi-day Jobs**: Handle jobs spanning multiple days with different rate categories
- **Timezone Support**: Accurate time calculations across different Australian timezones
- **Xero Sync**: Automatic synchronization with Xero for payroll processing and reporting
- **Tax Compliance**: Integration with Xero ensures ATO compliance and STP reporting

**API Endpoints:**
- `POST /payroll/{jobId}/draft` - Generate payroll calculations for a job
- `GET /payroll/reports` - Generate payroll reports for periods
- `POST /payroll/export/xero` - Export payroll data to Xero accounting system
- `GET /payroll/xero-sync-status` - Check Xero synchronization status

### 4. Client Completion Reports & Digital Signatures

#### Completion Documentation
- **Before/After Photos**: Visual proof of work completion
- **Task Completion Reports**: Detailed reports of all completed tasks
- **Time Spent Reports**: Accurate time tracking for billing
- **Incident Reports**: Documentation of any issues or incidents during work

#### Digital Client Sign-off with Evia Sign
- **Mobile-First Signatures**: Optimized signature capture on worker mobile devices
- **Evia Sign Integration**: Primary digital signature solution for professional document workflows
- **Dual Signature Options**: On-site mobile capture OR remote Evia Sign delivery
- **Multi-signature Support**: Handle multiple stakeholders via Evia Sign workflow
- **Client Details**: Record client name and role for verification
- **Legal Compliance**: Evia Sign provides audit trails and legal enforceability
- **Professional Branding**: Branded completion reports via Evia Sign templates
- **Status Monitoring**: Real-time signature tracking and completion notifications

**API Endpoints:**
- `POST /signoff/{jobId}` - Capture client digital signature
- `POST /signoff/{jobId}/evia-sign` - Send completion report for eSign via Evia Sign
- `GET /jobs/{jobId}/completion-report` - Generate completion report
- `GET /photos/{jobId}` - Retrieve before/after photos for reports
- `GET /signoff/{jobId}/evia-status` - Check Evia Sign document status

## Worker Capabilities

### 1. Time & Location Tracking

#### Complete Journey Tracking
- **Travel Start**: Clock in from start of travel to location with GPS coordinates
- **Arrival Tracking**: Automatic arrival detection and logging
- **Work Period Tracking**: Separate clock-in for actual work start
- **Break Management**: Record break times for accurate payroll
- **Departure Logging**: Clock-out with final GPS coordinates

#### Field Worker Offline Capability
- All time tracking works offline and syncs when connectivity returns
- GPS coordinates captured even without internet connection
- Accurate timestamp recording using device time
- Perfect for remote job sites with poor cellular coverage
- Managers can view real-time updates when workers sync data

**Mobile Features for Field Workers:**
- GPS coordinate capture for all attendance events (works offline)
- Offline queue stores all data when connection unavailable
- Background sync capabilities when connectivity returns
- Works in remote areas with poor cellular coverage
- Managers receive updates once workers connect to WiFi/cellular

### 2. Preparation Tasks & Safety

#### Pre-work Documentation
- **Safety Checks**: Complete mandatory safety checklists
- **Site Observations**: Record current site conditions
- **Equipment Checks**: Verify equipment and supplies
- **Hazard Assessment**: Document any safety hazards

#### Current Status Photography
- **Before Photos**: Capture site condition before work begins
- **Equipment Setup**: Document equipment placement and setup
- **Access Documentation**: Record access methods and restrictions

**Photo Types Supported:**
- `BEFORE` - Initial site condition
- `INCIDENT` - Any incidents or issues
- `AFTER` - Completed work documentation
- `SIGNATURE` - Digital signature capture

### 3. Task Management & Completion

#### Interactive Task Lists
- **Assigned Tasks**: View all tasks assigned to current job
- **Task Completion**: Mark tasks as completed with notes
- **Progress Tracking**: Real-time progress updates
- **Flexible Task Management**: Add additional tasks as needed

#### Work Documentation
- **Task Notes**: Add detailed notes for each completed task
- **Issue Reporting**: Report problems or obstacles encountered
- **Quality Assurance**: Self-assessment and quality checks

**API Endpoints:**
- `GET /jobs/{jobId}/tasks` - Get assigned tasks
- `POST /tasks/{jobId}/bulk` - Update task completion status
- `POST /tasks/{taskId}/notes` - Add task-specific notes

### 4. Completion Documentation

#### Photo Documentation
- **After Photos**: Capture completed work results
- **Detail Shots**: Document specific areas or achievements
- **Quality Verification**: Visual proof of work standards
- **Client Areas**: Document restored or improved areas

#### Professional Reporting
- **Work Summary**: Comprehensive summary of work completed
- **Time Documentation**: Accurate time spent on each area
- **Issue Resolution**: Documentation of how issues were resolved
- **Client Handover**: Prepare materials for client presentation

### 5. Performance & Salary Tracking

#### Personal Performance Dashboard
- **Job History**: View completed job history
- **Performance Metrics**: Personal productivity statistics
- **Time Analysis**: Breakdown of time spent on different activities
- **Completion Rates**: Task and job completion percentages

#### Payroll Transparency
- **Real-time Calculations**: View estimated earnings as work progresses
- **Rate Breakdown**: Understanding of different pay rates applied
- **Overtime Tracking**: Monitor overtime accumulation
- **Historical Payroll**: View previous payroll calculations and payments

**API Endpoints:**
- `GET /workers/{workerId}/performance` - Personal performance metrics
- `GET /workers/{workerId}/payroll` - Personal payroll history
- `GET /workers/{workerId}/jobs` - Personal job history

## Technical Features

### Offline-First Architecture (Worker-Focused)
- **Progressive Web App (PWA)**: Installs on Android/iOS devices for field workers
- **Worker Offline Functionality**: Full functionality without internet connection for field operations
- **Manager Online Operations**: Managers operate from office environments with reliable internet
- **Background Sync**: Automatic data synchronization when workers regain connectivity
- **Local Storage**: Secure local data storage for offline field operations

### Data Security & Compliance
- **7-Year Retention**: Compliant with Australian record-keeping requirements
- **Encrypted Storage**: Secure data transmission and storage
- **Audit Trails**: Complete audit trail for all activities
- **Backup Systems**: Regular automated backups of all data

### Integration Capabilities
- **Xero Accounting**: Direct integration for payroll, invoicing, and financial reporting
- **Evia Sign**: Primary digital signature solution - mobile-optimized for field workers
- **Mobile-First Design**: Worker interfaces optimized for mobile devices and touch screens
- **S3 Storage**: Secure photo and document storage using MinIO/S3
- **RESTful API**: Complete API for integration with other systems
- **OpenAPI Documentation**: Comprehensive API documentation
- **Database Flexibility**: PostgreSQL backend with Prisma ORM

## System Architecture

```
CleanOps Architecture
├── Manager Web Interface (Desktop/Tablet - Online)
│   ├── Real-time dashboard
│   ├── Job assignment & monitoring
│   ├── Payroll management
│   └── Reporting & analytics
├── Worker Mobile App (Mobile-First PWA - Offline Capable)
│   ├── Touch-optimized interface
│   ├── Mobile signature capture
│   ├── GPS and camera integration
│   ├── Local data storage
│   ├── Evia Sign integration
│   └── Background sync when connected
├── API Server (NestJS)
│   ├── Authentication & authorization
│   ├── Job and task management
│   ├── Payroll calculations
│   ├── Evia Sign integration
│   ├── Photo/signature handling
│   └── Offline sync endpoints
├── Database (PostgreSQL)
│   ├── Worker and job data
│   ├── Attendance records
│   └── Payroll calculations
└── External Integrations
    ├── Xero (Accounting)
    ├── Evia Sign (Digital Signatures)
    └── MinIO/S3 (Storage)
```

## Getting Started

Refer to the main [README.md](README.md) for detailed setup and deployment instructions.

## API Documentation

Complete API documentation is available at `/docs` when running the system, with the OpenAPI specification in `infra/openapi/openapi.yaml`.

## Support

For technical support or feature requests, please refer to the project repository or contact your system administrator.