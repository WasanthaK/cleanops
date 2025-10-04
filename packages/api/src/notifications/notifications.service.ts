/**
 * Notifications service for push notifications and in-app notifications
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { 
  CreateNotificationDto, 
  SubscribePushDto, 
  UpdatePreferencesDto,
  SendNotificationDto 
} from './dto/notification.dto.js';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a notification
   */
  async createNotification(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type as NotificationType,
        title: dto.title,
        message: dto.message,
        data: dto.data || null,
        actionUrl: dto.actionUrl || null
      }
    });

    this.logger.log(`Created notification ${notification.id} for user ${dto.userId}`);
    
    // Try to send push notification
    await this.sendPushNotification(dto.userId, notification).catch(error => {
      this.logger.error(`Failed to send push notification: ${error.message}`);
    });

    return notification;
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, unreadOnly: boolean = false) {
    const where: any = { userId };
    
    if (unreadOnly) {
      where.read = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 most recent
    });
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    const notification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    this.logger.log(`Marked notification ${notificationId} as read`);
    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    this.logger.log(`Marked ${result.count} notifications as read for user ${userId}`);
    return { count: result.count };
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    await this.prisma.notification.delete({
      where: { id: notificationId }
    });

    this.logger.log(`Deleted notification ${notificationId}`);
    return { message: 'Notification deleted successfully' };
  }

  /**
   * Subscribe to push notifications
   */
  async subscribePush(userId: string, dto: SubscribePushDto) {
    // Check if subscription already exists
    const existing = await this.prisma.pushSubscription.findUnique({
      where: { endpoint: dto.endpoint }
    });

    if (existing) {
      // Update existing subscription
      const subscription = await this.prisma.pushSubscription.update({
        where: { endpoint: dto.endpoint },
        data: {
          userId,
          keys: dto.keys,
          userAgent: dto.userAgent || null,
          active: true,
          lastUsed: new Date()
        }
      });

      this.logger.log(`Updated push subscription for user ${userId}`);
      return subscription;
    }

    // Create new subscription
    const subscription = await this.prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: dto.endpoint,
        keys: dto.keys,
        userAgent: dto.userAgent || null,
        active: true
      }
    });

    this.logger.log(`Created push subscription for user ${userId}`);
    return subscription;
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribePush(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.updateMany({
      where: {
        userId,
        endpoint
      },
      data: {
        active: false
      }
    });

    this.logger.log(`Unsubscribed push for user ${userId}`);
    return { message: 'Unsubscribed successfully' };
  }

  /**
   * Get user's push subscriptions
   */
  async getUserSubscriptions(userId: string) {
    return this.prisma.pushSubscription.findMany({
      where: {
        userId,
        active: true
      }
    });
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId }
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: { userId }
      });
    }

    return preferences;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const preferences = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...dto
      },
      update: dto
    });

    this.logger.log(`Updated notification preferences for user ${userId}`);
    return preferences;
  }

  /**
   * Send push notification to user
   * This is a placeholder - implement with web-push library
   */
  private async sendPushNotification(userId: string, notification: any) {
    // Check if user has push enabled
    const preferences = await this.getPreferences(userId);
    if (!preferences.pushEnabled) {
      this.logger.log(`Push notifications disabled for user ${userId}`);
      return;
    }

    // Get active subscriptions
    const subscriptions = await this.getUserSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      this.logger.log(`No active push subscriptions for user ${userId}`);
      return;
    }

    // In production, use web-push library to send notifications
    // Example:
    // const webpush = require('web-push');
    // for (const sub of subscriptions) {
    //   await webpush.sendNotification(
    //     { endpoint: sub.endpoint, keys: sub.keys },
    //     JSON.stringify({ title: notification.title, body: notification.message })
    //   );
    // }

    this.logger.log(`Would send push notification to ${subscriptions.length} devices for user ${userId}`);
  }

  /**
   * Send notification to user (creates notification + sends push)
   */
  async sendNotification(dto: SendNotificationDto) {
    return this.createNotification(dto);
  }

  /**
   * Trigger notification for job assignment
   */
  async notifyJobAssignment(workerId: string, jobId: string, jobTitle: string) {
    return this.sendNotification({
      userId: workerId,
      type: 'JOB_ASSIGNMENT' as any,
      title: 'New Job Assignment',
      message: `You have been assigned to: ${jobTitle}`,
      actionUrl: `/jobs/${jobId}`,
      data: { jobId, jobTitle }
    });
  }

  /**
   * Trigger notification for signature status
   */
  async notifySignatureStatus(workerId: string, jobId: string, status: string) {
    return this.sendNotification({
      userId: workerId,
      type: 'SIGNATURE_STATUS' as any,
      title: 'Signature Update',
      message: `Job signature status: ${status}`,
      actionUrl: `/jobs/${jobId}`,
      data: { jobId, status }
    });
  }

  /**
   * Trigger shift reminder
   */
  async notifyShiftReminder(workerId: string, jobId: string, jobTitle: string, startTime: Date) {
    return this.sendNotification({
      userId: workerId,
      type: 'SHIFT_REMINDER' as any,
      title: 'Shift Reminder',
      message: `Your shift for ${jobTitle} starts at ${startTime.toLocaleTimeString()}`,
      actionUrl: `/jobs/${jobId}`,
      data: { jobId, jobTitle, startTime }
    });
  }

  /**
   * Trigger emergency notification
   */
  async notifyEmergency(userIds: string[], title: string, message: string) {
    const notifications = await Promise.all(
      userIds.map(userId =>
        this.sendNotification({
          userId,
          type: 'EMERGENCY' as any,
          title,
          message,
          data: { priority: 'high' }
        })
      )
    );

    this.logger.log(`Sent emergency notification to ${userIds.length} users`);
    return { count: notifications.length };
  }

  /**
   * Trigger quality review notification
   */
  async notifyQualityReview(workerId: string, checklistId: string, status: string) {
    return this.sendNotification({
      userId: workerId,
      type: 'QUALITY_REVIEW' as any,
      title: 'Quality Review Update',
      message: `Your quality checklist has been ${status.toLowerCase()}`,
      actionUrl: `/quality/${checklistId}`,
      data: { checklistId, status }
    });
  }
}
