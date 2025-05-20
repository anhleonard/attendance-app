import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Sender } from '@prisma/client';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(Sender)
  @IsNotEmpty()
  sender: Sender;

  @IsNumber()
  @IsOptional()
  chatId?: number;
}
