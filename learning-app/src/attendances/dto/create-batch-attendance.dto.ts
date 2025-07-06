import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBatchAttendanceDto {
  @IsNumber()
  @IsNotEmpty()
  classId: number;

  @IsNumber()
  @IsNotEmpty()
  sessionId: number;

  @Transform(({ value }) => value && new Date(value))
  @IsDate()
  @IsNotEmpty()
  learningDate: Date;

  @IsBoolean()
  @IsNotEmpty()
  isSelectedAll: boolean;

  @IsArray()
  @IsOptional()
  selectedStudentIds?: number[];

  @IsArray()
  @IsOptional()
  unselectedStudentIds?: number[];
} 