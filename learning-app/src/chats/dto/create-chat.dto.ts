import { IsString, IsNotEmpty } from 'class-validator';

export class CreateChatDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  userId: number;
}
