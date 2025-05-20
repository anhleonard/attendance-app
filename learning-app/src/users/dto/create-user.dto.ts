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

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role: Role;

  @IsArray()
  @IsOptional()
  permissions: Permission[];
}
