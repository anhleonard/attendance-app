import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAttendanceDto {
  @IsNumber()
  @IsNotEmpty()
  studentId: number;

  @IsNumber()
  @IsNotEmpty()
  sessionId: number;

  @IsBoolean()
  @IsNotEmpty()
  isAttend: boolean;

  @IsString()
  @IsOptional()
  noteAttendance: string;

  @Transform(({ value }) => value && new Date(value))
  @IsDate()
  @IsNotEmpty()
  learningDate: Date;
}
