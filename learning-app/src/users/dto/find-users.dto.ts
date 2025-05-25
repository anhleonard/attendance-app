import { IsNumber, IsOptional, Min, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from 'src/utils/enums';

export class FilterUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  fullname?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
