import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl, body } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Log successful response
          console.log(
            `🌐 [${method}] ${originalUrl} - ${statusCode} (${responseTime}ms)`,
          );
          console.log(`📥 Request from: ${request.ip}`);
          console.log(`🔗 User-Agent: ${userAgent.substring(0, 50)}...`);
          if (Object.keys(body).length > 0) {
            console.log(`📦 Request body:`, body);
          }
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Log error response
          this.logger.error(
            `[Error] ${method} ${originalUrl} ${statusCode} - ${responseTime}ms`,
          );
          this.logger.error('Error Details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            response: error.response,
          });
        },
      }),
      catchError((error) => {
        // Log error and rethrow
        return throwError(() => error);
      }),
    );
  }
}
