import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Permission } from 'src/utils/enums';
import { Role } from 'src/utils/enums';

export enum UserType {
  SYSTEM_USER = 'system-user',
  NORMAL_USER = 'normal-user',
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsArray()
  @IsOptional()
  permissions?: Permission[];

  @IsEnum(UserType)
  @IsNotEmpty()
  type: UserType;
}
