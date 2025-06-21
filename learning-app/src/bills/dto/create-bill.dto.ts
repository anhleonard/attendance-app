import {
  IsString,
  IsNotEmpty,
  IsNumberString,
  IsArray,
  IsOptional,
} from 'class-validator';

export class CreateBillDto {
  @IsString()
  @IsNotEmpty()
  studentName: string;

  @IsString()
  @IsNotEmpty()
  class: string;

  @IsString()
  @IsNotEmpty()
  month: string;

  @IsNumberString()
  @IsNotEmpty()
  amount: string;

  // Fields tùy chọn
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  learningDates?: string[];

  @IsString()
  @IsOptional()
  sessionCount?: string;

  @IsString()
  @IsOptional()
  amountPerSession?: string;

  @IsString()
  @IsOptional()
  totalAmount?: string;
}
