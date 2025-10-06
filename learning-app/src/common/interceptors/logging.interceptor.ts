import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { getRequestId } from '../utils/als.util';
import { maskSensitiveData } from '../utils/logging.util';
import { logger } from '../../utils/logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl, body } = request;
    const startTime = Date.now();
    const requestId = getRequestId();

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const responseTime = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Create a more readable log message for text format with requestId
          const logMessage = `${method} ${originalUrl} - ${statusCode} (${responseTime}ms)`;
          const logData = {
            requestId,
            method,
            url: originalUrl,
            statusCode,
            responseTime,
            body: Object.keys(body).length > 0 ? maskSensitiveData(body) : undefined,
            responseBody: responseBody ? maskSensitiveData(responseBody) : undefined,
          };

          logger.info(logMessage, logData);
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;

          // Create a more readable error log message for text format with requestId
          const errorMessage = `${method} ${originalUrl} - ERROR (${responseTime}ms): ${error.message || 'Unknown error'}`;
          const errorData = {
            requestId,
            method,
            url: originalUrl,
            responseTime,
            body: Object.keys(body).length > 0 ? maskSensitiveData(body) : undefined,
            error: {
              name: error.name,
              message: error.message,
              code: error.code || error.status,
              stack: error.stack,
            },
          };

          logger.error(errorMessage, errorData);
        },
      }),
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }
}
