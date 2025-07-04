import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Permission, Role, SortType } from './enums';
import { Role as PrismaRole } from '@prisma/client';

export interface CreateAttendance {
  studentId: number;
  sessionId: number;
  isAttend: boolean;
  noteAttendance: string;
}

export interface User {
  id: number;
  email?: string;
  fullname?: string;
  avatar?: string;
  role?: Role;
  permissions?: Permission[];
  createdAt?: string;
  updatedAt?: string;
  locked?: boolean;
}

export interface NotificationPayload {
  id: number;
  title: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: number;
  createdBy: {
    id: number;
    fullname: string;
    role: PrismaRole;
  };
  receivers: Array<{
    notificationId: number;
    userId: number;
    fullname: string;
    isRead: boolean;
  }>;
}

export class SortDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsEnum(SortType)
  @IsOptional()
  order: SortType;
}
