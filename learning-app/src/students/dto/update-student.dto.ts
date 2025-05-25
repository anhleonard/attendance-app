import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Status } from '@prisma/client';

export class UpdateStudentDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsInt()
  @IsOptional()
  classId?: number;

  @IsString()
  @IsOptional()
  name: string;

  @Transform(({ value }) => value && new Date(value))
  @IsDate()
  @IsOptional()
  dob: Date;

  @IsString()
  @IsOptional()
  parent: string;

  @IsString()
  @IsOptional()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  secondPhoneNumber: string;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}
