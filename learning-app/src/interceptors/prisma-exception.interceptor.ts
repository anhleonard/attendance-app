import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class PrismaExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        // Xử lý lỗi Prisma
        if (error.code) {
          switch (error.code) {
            case 'P1001':
              return throwError(() => new BadRequestException('Database connection failed'));
            case 'P2021':
              return throwError(() => new BadRequestException('Database table does not exist'));
            case 'P2022':
              return throwError(() => new BadRequestException('Database column does not exist'));
            case 'P2002':
              return throwError(() => new BadRequestException('Duplicate entry found'));
            case 'P2025':
              return throwError(() => new BadRequestException('Record not found'));
            default:
              return throwError(() => new BadRequestException('Database error occurred'));
          }
        }
        
        // Nếu không phải lỗi Prisma, trả về lỗi gốc
        return throwError(() => error);
      }),
    );
  }
} 