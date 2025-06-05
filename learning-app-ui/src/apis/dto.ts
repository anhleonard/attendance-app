import { Permission, Role, SessionKey, Status } from "@/config/enums";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  fullname: string;
  email: string;
  password?: string;
  role?: Role;
  permissions?: Permission[];
  type?: "normal-user" | "system-user";
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
  studentClassStatus?: Status;
  fetchAll?: boolean;
  isSort?: boolean;
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
  chatId?: number;
  fetchAll?: boolean;
  page?: number;
  limit?: number;
  isSaved?: boolean;
}
export interface UpdateMessageDto {
  messageId: number;
  isSaved: boolean;
}

export interface FilterPaymentDto {
  name?: string; // the name of student
  page?: number;
  rowPerPage?: number;
  classId?: number;
  learningMonth?: number;
  learningYear?: number;
}

export interface FilterHistoryDto {
  studentName?: string;
  classId?: number;
  page?: number;
  rowPerPage?: number;
}

export interface FilterUsersDto {
  page?: number;
  limit?: number;
  fullname?: string;
  role?: Role;
  fetchAll?: boolean;
  status?: Status;
}

export interface UserResponse {
  id: number;
  email: string;
  fullname: string;
  role: Role;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  data: UserResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateUserDto {
  id: number;
  fullname?: string;
  email?: string;
  role?: Role;
  permissions?: Permission[];
  locked?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface FilterNotificationsDto {
  page?: number;
  limit?: number;
  isRead?: boolean;
  fetchAll?: boolean;
  userId?: number; // the user id of the receiver
  createdById?: number; // the user id of the sender
}

export interface UpdateNotificationDto {
  id: number;
  title?: string;
  message?: string;
  isRead?: boolean;
}

export interface CreateNotificationDto {
  title: string;
  message: string;
  receiverIds: number[];
}

export interface ImportFileStudentDto {
  classId: number;
  file: File;
}
