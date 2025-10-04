/**
 * Voice controller for audio recording and transcription endpoints
 */
import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { VoiceService } from './voice.service.js';
import { 
  CreateVoiceNoteDto, 
  TranscribeAudioDto, 
  VoiceCommandDto,
  AudioUploadRequestDto 
} from './dto/voice.dto.js';

@ApiBearerAuth()
@ApiTags('voice')
@Controller('voice')
export class VoiceController {
  constructor(private readonly service: VoiceService) {}

  @Post('notes')
  createVoiceNote(@Req() req: Request, @Body() dto: CreateVoiceNoteDto) {
    const workerId = (req.user as { sub: string }).sub;
    return this.service.createVoiceNote(workerId, dto);
  }

  @Get('notes/:id')
  getVoiceNote(@Param('id') id: string) {
    return this.service.getVoiceNote(id);
  }

  @Get('notes/:id/audio')
  async getAudio(@Param('id') id: string) {
    const url = await this.service.getAudioUrl(id);
    return { url };
  }

  @Get('notes/:id/transcript')
  getTranscript(@Param('id') id: string) {
    return this.service.getTranscript(id);
  }

  @Post('transcribe')
  async transcribeAudio(@Body() dto: TranscribeAudioDto) {
    const transcript = await this.service.transcribeAudio(dto);
    return { transcript };
  }

  @Put('notes/:id/transcript')
  updateTranscript(@Param('id') id: string, @Body() body: { transcript: string }) {
    return this.service.updateTranscript(id, body.transcript);
  }

  @Post('command')
  processCommand(@Req() req: Request, @Body() dto: VoiceCommandDto) {
    const workerId = (req.user as { sub: string }).sub;
    return this.service.processVoiceCommand(workerId, dto);
  }

  @Get('jobs/:jobId/notes')
  listJobVoiceNotes(@Param('jobId') jobId: string) {
    return this.service.listJobVoiceNotes(jobId);
  }

  @Get('workers/:workerId/notes')
  listWorkerVoiceNotes(@Param('workerId') workerId: string) {
    return this.service.listWorkerVoiceNotes(workerId);
  }

  @Delete('notes/:id')
  deleteVoiceNote(@Param('id') id: string) {
    return this.service.deleteVoiceNote(id);
  }

  @Post('upload-request')
  requestUpload(@Body() dto: AudioUploadRequestDto) {
    return this.service.requestAudioUpload(dto.contentType);
  }
}
