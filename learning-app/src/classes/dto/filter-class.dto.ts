import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Status } from 'src/utils/enums';

export class FilterClassDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsEnum(Status)
  @IsOptional()
  status: Status;

  @IsNumber()
  @IsOptional()
  page: number;

  @IsNumber()
  @IsOptional()
  rowPerPage: number;

  @Transform(({ value }) => value && new Date(value))
  @IsDate()
  @IsOptional()
  learningDate: Date;

  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  month: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year: number;

  @IsBoolean()
  @IsOptional()
  fetchAll: boolean;

  @IsBoolean()
  @IsOptional()
  hasHistories: boolean = false;
}
