-- CreateTable
CREATE TABLE "VoiceNote" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "taskId" TEXT,
    "incidentId" TEXT,
    "workerId" TEXT NOT NULL,
    "audioKey" TEXT NOT NULL,
    "transcript" TEXT,
    "duration" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en-US',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceNote_workerId_idx" ON "VoiceNote"("workerId");

-- CreateIndex
CREATE INDEX "VoiceNote_jobId_idx" ON "VoiceNote"("jobId");

-- AddForeignKey
ALTER TABLE "VoiceNote" ADD CONSTRAINT "VoiceNote_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceNote" ADD CONSTRAINT "VoiceNote_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
