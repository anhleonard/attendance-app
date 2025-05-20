import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateSessionDto } from 'src/sessions/dto/create-session.dto';
import { Status } from 'src/utils/enums';

export class UpdateClassDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsArray()
  @IsOptional()
  sessions: CreateSessionDto[];

  @IsEnum(Status)
  @IsOptional()
  status: Status;
}
