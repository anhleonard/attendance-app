import { Transform } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateStudentDto {
  @IsNumber()
  @IsNotEmpty()
  classId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @Transform(({ value }) => value && new Date(value))
  @IsDate()
  @IsNotEmpty()
  dob: Date;

  @IsString()
  @IsNotEmpty()
  parent: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  secondPhoneNumber: string;
}
