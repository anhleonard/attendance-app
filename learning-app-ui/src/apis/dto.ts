import { Permission, Role, SessionKey, Status } from "@/config/enums";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  fullname: string;
  email: string;
  password: string;
  role?: Role;
  permissions?: Permission[];
}

export interface CreateSessionDto {
  id?: number;
  sessionKey: SessionKey;
  startTime: string;
  endTime: string;
  amount: number;
}

export interface CreateClassDto {
  name: string;
  description: string;
  sessions: CreateSessionDto[];
}

export interface FilterClassDto {
  name?: string;
  status?: Status;
  page?: number;
  rowPerPage?: number;
  learningDate?: Date;
  fetchAll?: boolean;
}

export interface FilterCalendarDto {
  month: number;
  year: number;
}

export interface UpdateClassDto {
  id: number;
  name?: string;
  description?: string;
  sessions?: CreateSessionDto[];
  status?: Status;
}

export interface CreateStudentDto {
  classId: number;
  name: string;
  dob: Date;
  parent: string;
  phoneNumber: string;
  secondPhoneNumber?: string;
}

export interface UpdateStudentDto {
  id: number;
  classId?: number;
  name?: string;
  dob?: Date;
  parent?: string;
  phoneNumber?: string;
  secondPhoneNumber?: string;
}

export interface FilterStudentDto {
  name?: string;
  classId?: number;
  page?: number;
  rowPerPage?: number;
  status?: Status;
  fetchAll?: boolean;
}

export interface FilterAttendanceDto {
  paymentId?: number;
  classId?: number;
  isAttend?: boolean;
  learningDate?: Date;
  learningMonth?: number;
  learningYear?: number;
  page?: number;
  rowPerPage?: number;
}

export interface CreateAttendanceDto {
  studentId: number;
  sessionId: number;
  isAttend: boolean;
  noteAttendance?: string;
  learningDate: Date;
}

export interface UpdateAttendanceItemDto {
  studentId: number;
  sessionId: number;
  attendanceId: number;
  isAttend: boolean;
  noteAttendance?: string;
}

export interface UpdateBatchAttendanceDto {
  classId: number;
  learningDate: Date;
  attendances: UpdateAttendanceItemDto[];
}

export interface FilterChatDto {
  page?: number;
  rowPerPage?: number;
}

export interface UpdateChatDto {
  chatId: number;
  title?: string;
}

export interface FilterMessageDto {
  chatId: number;
  page: number;
  limit: number;
}
