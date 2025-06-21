import { IsString, IsInt, IsNotEmpty, IsEnum, Matches, IsOptional, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';
import { SessionKey } from 'src/utils/enums';

export class CreateSessionDto {
  @IsEnum(SessionKey)
  @IsNotEmpty()
  sessionKey: SessionKey;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string;

  @IsInt()
  @IsNotEmpty()
  amount: number;

  @Transform(({ value }) => value && new Date(value))
  @IsDate()
  @IsOptional()
  validFrom?: Date;

  @Transform(({ value }) => value && new Date(value))
  @IsDate()
  @IsOptional()
  validTo?: Date;
}
