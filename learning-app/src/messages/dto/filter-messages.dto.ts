import { IsNumber, IsOptional, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterMessagesDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  chatId?: number;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isSaved?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  fetchAll?: boolean = false;

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
