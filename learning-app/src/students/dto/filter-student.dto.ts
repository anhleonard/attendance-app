import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Status } from 'src/utils/enums';

export class FilterStudentDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsNumber()
  @IsOptional()
  classId: number; // id of class

  @IsEnum(Status)
  @IsOptional()
  status: Status;

  @IsEnum(Status)
  @IsOptional()
  studentClassStatus: Status;

  @IsNumber()
  @IsOptional()
  page: number;

  @IsNumber()
  @IsOptional()
  rowPerPage: number;

  @IsBoolean()
  @IsOptional()
  fetchAll?: boolean;
}
