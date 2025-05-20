import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterMessagesDto {
  @Type(() => Number)
  @IsNumber()
  chatId: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
