import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateChatDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  chatId: number;

  @IsString()
  @IsNotEmpty()
  title: string;
} 