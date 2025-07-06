import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class UpdateAttendanceItemDto {
  @IsNumber()
  @IsNotEmpty()
  attendanceId: number;

  @IsBoolean()
  @IsNotEmpty()
  isAttend: boolean;

  @IsString()
  @IsNotEmpty()
  noteAttendance: string;
}

export class UpdateBatchAttendanceDto {
  @IsArray()
  @IsNotEmpty()
  attendances: UpdateAttendanceItemDto[];
}
