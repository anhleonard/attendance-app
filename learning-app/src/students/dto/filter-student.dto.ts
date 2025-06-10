import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Status } from 'src/utils/enums';
import { Type } from 'class-transformer';
import { SortDto } from 'src/utils/interfaces';

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

  @ValidateNested()
  @Type(() => SortDto)
  @IsOptional()
  sort: SortDto;
}
