import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { PaymentStatus } from 'src/utils/enums';

export class DownloadBillsDto {
  @IsString()
  @IsOptional()
  name: string; // the name of student

  @IsNumber()
  @IsOptional()
  classId: number;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

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
} 