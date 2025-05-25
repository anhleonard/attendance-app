import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Permission } from 'src/utils/enums';

export class UpdateUserDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsOptional()
  fullname: string;

  @IsString()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  role: string;

  @IsArray()
  @IsOptional()
  permissions: Permission[];

  @IsBoolean()
  @IsOptional()
  locked: boolean;
}
