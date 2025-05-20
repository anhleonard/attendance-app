import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterChatsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  rowPerPage?: number = 10;
}
