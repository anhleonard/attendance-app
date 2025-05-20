import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterAttendanceDto {
  @IsOptional()
  @IsNumber()
  paymentId: number;

  @IsOptional()
  @IsNumber()
  classId: number;

  @IsOptional()
  @IsBoolean()
  isAttend: boolean;

  @Transform(({ value }) => value && new Date(value))
  @IsDate()
  @IsOptional()
  learningDate: Date;

  @ValidateIf(
    (o) => o.learningYear !== undefined || o.learningMonth !== undefined,
  )
  @IsNumber()
  learningMonth?: number;

  @ValidateIf(
    (o) => o.learningMonth !== undefined || o.learningYear !== undefined,
  )
  @IsNumber()
  learningYear?: number;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  rowPerPage?: number;
}
