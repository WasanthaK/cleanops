-- Phase 1 Integration Models Migration
-- This migration adds Xero, Evia Sign, and Job Template models
-- Run this after the initial migration if not already applied

-- Create Xero enums
DO $$ BEGIN
    CREATE TYPE "XeroSyncStatus" AS ENUM ('CONNECTED', 'SYNCING', 'ERROR', 'DISCONNECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Evia Sign enums
DO $$ BEGIN
    CREATE TYPE "EviaSignStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'SIGNED', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'DECLINED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Xero Integration table
CREATE TABLE IF NOT EXISTS "XeroIntegration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" "XeroSyncStatus" NOT NULL,
    "payrollMapping" JSONB NOT NULL,
    "expenseMapping" JSONB,
    "taxMapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XeroIntegration_pkey" PRIMARY KEY ("id")
);

-- Create Xero Sync Log table
CREATE TABLE IF NOT EXISTS "XeroSyncLog" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XeroSyncLog_pkey" PRIMARY KEY ("id")
);

-- Create Evia Sign Document table
CREATE TABLE IF NOT EXISTS "EviaSignDocument" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "eviaDocId" TEXT NOT NULL,
    "status" "EviaSignStatus" NOT NULL,
    "documentType" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "signedPdfUrl" TEXT,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "webhookEvents" JSONB,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EviaSignDocument_pkey" PRIMARY KEY ("id")
);

-- Create Evia Sign Template table
CREATE TABLE IF NOT EXISTS "EviaSignTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eviaTemplateId" TEXT,
    "documentType" TEXT NOT NULL,
    "templateData" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EviaSignTemplate_pkey" PRIMARY KEY ("id")
);

-- Create Job Template table
CREATE TABLE IF NOT EXISTS "JobTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "estimatedHours" DOUBLE PRECISION,
    "basePrice" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobTemplate_pkey" PRIMARY KEY ("id")
);

-- Create Task Template table
CREATE TABLE IF NOT EXISTS "TaskTemplate" (
    "id" TEXT NOT NULL,
    "jobTemplateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedMinutes" INTEGER,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "XeroIntegration_tenantId_key" ON "XeroIntegration"("tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "EviaSignDocument_eviaDocId_key" ON "EviaSignDocument"("eviaDocId");

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "XeroSyncLog" ADD CONSTRAINT "XeroSyncLog_integrationId_fkey" 
    FOREIGN KEY ("integrationId") REFERENCES "XeroIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "EviaSignDocument" ADD CONSTRAINT "EviaSignDocument_jobId_fkey" 
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_jobTemplateId_fkey" 
    FOREIGN KEY ("jobTemplateId") REFERENCES "JobTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "XeroSyncLog_integrationId_idx" ON "XeroSyncLog"("integrationId");
CREATE INDEX IF NOT EXISTS "XeroSyncLog_createdAt_idx" ON "XeroSyncLog"("createdAt");
CREATE INDEX IF NOT EXISTS "EviaSignDocument_jobId_idx" ON "EviaSignDocument"("jobId");
CREATE INDEX IF NOT EXISTS "EviaSignDocument_status_idx" ON "EviaSignDocument"("status");
CREATE INDEX IF NOT EXISTS "TaskTemplate_jobTemplateId_idx" ON "TaskTemplate"("jobTemplateId");
CREATE INDEX IF NOT EXISTS "JobTemplate_category_idx" ON "JobTemplate"("category");
CREATE INDEX IF NOT EXISTS "JobTemplate_active_idx" ON "JobTemplate"("active");
