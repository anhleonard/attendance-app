import { IsNumber, IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateMessageDto {
  @IsNumber()
  @IsNotEmpty()
  messageId: number;

  @IsBoolean()
  @IsNotEmpty()
  isSaved: boolean;
}
