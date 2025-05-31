import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { Role, Permission } from 'src/utils/enums';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsOptional()
  fullname?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsArray()
  @IsOptional()
  @IsEnum(Permission, { each: true })
  permissions?: Permission[];

  @IsBoolean()
  @IsOptional()
  locked?: boolean;
}
