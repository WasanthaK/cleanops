/**
 * Evia Sign integration controller for document signing workflows.
 */
import { Controller, Post, Get, Body, Param, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { EviaSignService } from './evia-sign.service.js';
import { SendDocumentDto } from './dto/send-document.dto.js';
import { WebhookEventDto } from './dto/webhook-event.dto.js';

@ApiBearerAuth()
@ApiTags('integrations/evia-sign')
@Controller('integrations/evia-sign')
export class EviaSignController {
  constructor(private readonly eviaSignService: EviaSignService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send document for signing' })
  async sendDocument(@Body() dto: SendDocumentDto) {
    return this.eviaSignService.sendDocument(dto);
  }

  @Get('document/:id')
  @ApiOperation({ summary: 'Get document status' })
  async getDocumentStatus(@Param('id') id: string) {
    return this.eviaSignService.getDocumentStatus(id);
  }

  @Post('webhook/status')
  @ApiOperation({ summary: 'Handle webhook from Evia Sign' })
  async handleWebhook(
    @Body() dto: WebhookEventDto,
    @Headers('x-evia-signature') signature: string
  ) {
    return this.eviaSignService.handleWebhook(dto, signature || '');
  }
}
