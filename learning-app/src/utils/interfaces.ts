import { Permission, Role } from './enums';
import { Role as PrismaRole } from '@prisma/client';

export interface AlsStore {
  requestId: string;
}

export interface CreateAttendance {
  studentId: number;
  sessionId: number;
  classId: number;
  learningDate: Date;
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
