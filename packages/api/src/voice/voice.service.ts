/**
 * Voice service for audio recording, transcription, and voice commands
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { S3Service } from '../photos/s3.service.js';
import { CreateVoiceNoteDto, TranscribeAudioDto, VoiceCommandDto } from './dto/voice.dto.js';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service
  ) {}

  /**
   * Create a voice note
   */
  async createVoiceNote(workerId: string, dto: CreateVoiceNoteDto) {
    const voiceNote = await this.prisma.voiceNote.create({
      data: {
        workerId,
        jobId: dto.jobId ?? null,
        taskId: dto.taskId ?? null,
        incidentId: dto.incidentId ?? null,
        audioKey: dto.audioKey,
        transcript: dto.transcript ?? null,
        duration: dto.duration,
        language: dto.language ?? 'en-US'
      }
    });

    this.logger.log(`Created voice note ${voiceNote.id} for worker ${workerId}`);
    return voiceNote;
  }

  /**
   * Get voice note by ID
   */
  async getVoiceNote(id: string) {
    const voiceNote = await this.prisma.voiceNote.findUnique({
      where: { id },
      include: {
        worker: {
          select: { id: true, name: true, email: true }
        },
        job: {
          select: { id: true, title: true }
        }
      }
    });

    if (!voiceNote) {
      throw new NotFoundException(`Voice note ${id} not found`);
    }

    return voiceNote;
  }

  /**
   * Get audio URL for a voice note
   */
  async getAudioUrl(id: string): Promise<string> {
    const voiceNote = await this.prisma.voiceNote.findUnique({
      where: { id }
    });

    if (!voiceNote) {
      throw new NotFoundException(`Voice note ${id} not found`);
    }

    return this.s3.createDownloadUrl(voiceNote.audioKey, 3600);
  }

  /**
   * Get transcript for a voice note
   */
  async getTranscript(id: string) {
    const voiceNote = await this.prisma.voiceNote.findUnique({
      where: { id },
      select: { id: true, transcript: true, language: true, createdAt: true }
    });

    if (!voiceNote) {
      throw new NotFoundException(`Voice note ${id} not found`);
    }

    return voiceNote;
  }

  /**
   * Transcribe audio (placeholder - uses Web Speech API on client)
   * In production, integrate with Google Cloud Speech or AWS Transcribe
   */
  async transcribeAudio(dto: TranscribeAudioDto): Promise<string> {
    // This is a placeholder. In production:
    // 1. Download audio from S3 using dto.audioKey
    // 2. Send to transcription service (Google Cloud Speech / AWS Transcribe)
    // 3. Return transcribed text
    
    this.logger.warn('Transcription service not configured - using client-side Web Speech API');
    
    // Return placeholder text for now
    return 'Transcription will be performed client-side using Web Speech API';
  }

  /**
   * Update voice note with transcript
   */
  async updateTranscript(id: string, transcript: string) {
    const voiceNote = await this.prisma.voiceNote.update({
      where: { id },
      data: { transcript }
    });

    this.logger.log(`Updated transcript for voice note ${id}`);
    return voiceNote;
  }

  /**
   * Process voice command
   */
  async processVoiceCommand(workerId: string, dto: VoiceCommandDto) {
    const command = dto.command.toLowerCase().trim();
    
    this.logger.log(`Processing voice command from worker ${workerId}: "${command}"`);

    // Parse common commands
    if (command.includes('start job') || command.includes('clock in')) {
      return {
        action: 'CLOCK_IN',
        jobId: dto.jobId,
        message: 'Ready to clock in'
      };
    }

    if (command.includes('clock out') || command.includes('end shift')) {
      return {
        action: 'CLOCK_OUT',
        jobId: dto.jobId,
        message: 'Ready to clock out'
      };
    }

    if (command.includes('complete task')) {
      // Extract task name from command
      const taskMatch = command.match(/complete task (.+)/);
      return {
        action: 'COMPLETE_TASK',
        taskName: taskMatch?.[1] || null,
        jobId: dto.jobId,
        message: `Ready to complete task${taskMatch?.[1] ? ': ' + taskMatch[1] : ''}`
      };
    }

    if (command.includes('report incident') || command.includes('incident report')) {
      return {
        action: 'REPORT_INCIDENT',
        jobId: dto.jobId,
        message: 'Ready to create incident report'
      };
    }

    if (command.includes('take photo') || command.includes('capture photo')) {
      return {
        action: 'TAKE_PHOTO',
        jobId: dto.jobId,
        message: 'Ready to take photo'
      };
    }

    // Unknown command
    return {
      action: 'UNKNOWN',
      message: 'Command not recognized. Try: "clock in", "clock out", "complete task", "report incident", or "take photo"'
    };
  }

  /**
   * List voice notes for a job
   */
  async listJobVoiceNotes(jobId: string) {
    return this.prisma.voiceNote.findMany({
      where: { jobId },
      include: {
        worker: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * List voice notes for a worker
   */
  async listWorkerVoiceNotes(workerId: string) {
    return this.prisma.voiceNote.findMany({
      where: { workerId },
      include: {
        job: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Delete a voice note
   */
  async deleteVoiceNote(id: string) {
    const voiceNote = await this.prisma.voiceNote.findUnique({
      where: { id }
    });

    if (!voiceNote) {
      throw new NotFoundException(`Voice note ${id} not found`);
    }

    await this.prisma.voiceNote.delete({
      where: { id }
    });

    this.logger.log(`Deleted voice note ${id}`);
    return { message: 'Voice note deleted successfully' };
  }

  /**
   * Request audio upload URL
   */
  async requestAudioUpload(contentType: string) {
    return this.s3.createUploadUrl(contentType);
  }
}
