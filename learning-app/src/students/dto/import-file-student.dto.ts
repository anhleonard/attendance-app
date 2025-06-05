import { IsNotEmpty, IsNumber } from 'class-validator';

export class ImportFileStudentDto {
  @IsNotEmpty()
  @IsNumber()
  classId: number;

  file: Express.Multer.File;
}
