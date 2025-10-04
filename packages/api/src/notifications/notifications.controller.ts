/**
 * Notifications controller for managing push notifications and preferences
 */
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationsService } from './notifications.service.js';
import { 
  SubscribePushDto, 
  UpdatePreferencesDto,
  SendNotificationDto 
} from './dto/notification.dto.js';

@ApiBearerAuth()
@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  getNotifications(@Req() req: Request, @Query('unreadOnly') unreadOnly?: string) {
    const userId = (req.user as { sub: string }).sub;
    return this.service.getNotifications(userId, unreadOnly === 'true');
  }

  @Get('count')
  getUnreadCount(@Req() req: Request) {
    const userId = (req.user as { sub: string }).sub;
    return this.service.getUnreadCount(userId);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(id);
  }

  @Put('read-all')
  markAllAsRead(@Req() req: Request) {
    const userId = (req.user as { sub: string }).sub;
    return this.service.markAllAsRead(userId);
  }

  @Delete(':id')
  deleteNotification(@Param('id') id: string) {
    return this.service.deleteNotification(id);
  }

  @Post('subscribe')
  subscribePush(@Req() req: Request, @Body() dto: SubscribePushDto) {
    const userId = (req.user as { sub: string }).sub;
    return this.service.subscribePush(userId, dto);
  }

  @Delete('unsubscribe')
  unsubscribePush(@Req() req: Request, @Body() body: { endpoint: string }) {
    const userId = (req.user as { sub: string }).sub;
    return this.service.unsubscribePush(userId, body.endpoint);
  }

  @Get('subscriptions')
  getSubscriptions(@Req() req: Request) {
    const userId = (req.user as { sub: string }).sub;
    return this.service.getUserSubscriptions(userId);
  }

  @Get('preferences')
  getPreferences(@Req() req: Request) {
    const userId = (req.user as { sub: string }).sub;
    return this.service.getPreferences(userId);
  }

  @Put('preferences')
  updatePreferences(@Req() req: Request, @Body() dto: UpdatePreferencesDto) {
    const userId = (req.user as { sub: string }).sub;
    return this.service.updatePreferences(userId, dto);
  }

  @Post('send')
  sendNotification(@Body() dto: SendNotificationDto) {
    return this.service.sendNotification(dto);
  }
}
