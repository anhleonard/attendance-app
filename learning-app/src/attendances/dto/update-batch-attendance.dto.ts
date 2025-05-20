import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateAttendanceItemDto {
  @IsNumber()
  @IsNotEmpty()
  studentId: number;

  @IsNumber()
  @IsNotEmpty()
  sessionId: number;

  @IsNumber()
  @IsNotEmpty()
  attendanceId: number;

  @IsBoolean()
  @IsNotEmpty()
  isAttend: boolean;

  @IsString()
  @IsNotEmpty()
  noteAttendance: string;
}

export class UpdateBatchAttendanceDto {
  @IsNumber()
  @IsNotEmpty()
  classId: number;

  @Transform(({ value }) => value && new Date(value))
  @IsDate()
  @IsNotEmpty()
  learningDate: Date;

  @IsArray()
  @IsNotEmpty()
  attendances: UpdateAttendanceItemDto[];
}
