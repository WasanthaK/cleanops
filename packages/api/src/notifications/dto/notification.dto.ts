/**
 * DTOs for push notifications
 */
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum NotificationTypeDto {
  JOB_ASSIGNMENT = 'JOB_ASSIGNMENT',
  SIGNATURE_STATUS = 'SIGNATURE_STATUS',
  SHIFT_REMINDER = 'SHIFT_REMINDER',
  EMERGENCY = 'EMERGENCY',
  QUALITY_REVIEW = 'QUALITY_REVIEW',
  SERVICE_REQUEST = 'SERVICE_REQUEST',
  GENERAL = 'GENERAL'
}

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(NotificationTypeDto)
  type!: NotificationTypeDto;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  data?: any;

  @IsOptional()
  @IsString()
  actionUrl?: string;
}

export class SubscribePushDto {
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @IsNotEmpty()
  keys!: {
    p256dh: string;
    auth: string;
  };

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  jobAssignments?: boolean;

  @IsOptional()
  @IsBoolean()
  signatureStatus?: boolean;

  @IsOptional()
  @IsBoolean()
  shiftReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  emergencyAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  qualityReviews?: boolean;

  @IsOptional()
  @IsBoolean()
  serviceRequests?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;
}

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(NotificationTypeDto)
  type!: NotificationTypeDto;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  data?: any;

  @IsOptional()
  @IsString()
  actionUrl?: string;
}
