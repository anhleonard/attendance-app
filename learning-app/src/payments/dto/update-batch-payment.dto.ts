import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  ValidateIf,
  IsString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus } from 'src/utils/enums';

export class BatchPaymentFilter {
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

export class UpdateBatchPaymentsDto {
  @IsBoolean()
  @IsOptional()
  isSelectedAll?: boolean;

  @ValidateIf((o) => o.isSelectedAll === true)
  @IsArray()
  @IsOptional()
  unselectedPaymentIds?: number[];

  @ValidateIf((o) => o.isSelectedAll === false)
  @IsArray()
  @IsOptional()
  selectedPaymentIds?: number[];

  @IsEnum([PaymentStatus.SENT, PaymentStatus.DONE])
  @IsNotEmpty()
  status: PaymentStatus.SENT | PaymentStatus.DONE;

  @ValidateNested()
  @Type(() => BatchPaymentFilter)
  @IsOptional()
  filter?: BatchPaymentFilter;
}
