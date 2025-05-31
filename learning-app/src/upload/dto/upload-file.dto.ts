import { IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsOptional()
  folder: string;
}
