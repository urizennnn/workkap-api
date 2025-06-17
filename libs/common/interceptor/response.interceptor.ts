import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, catchError, map, throwError } from 'rxjs';

@Injectable()
export class FormatResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: unknown) => ({
        status: 'success',
        data,
      })),
      catchError((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Internal server error';

        if (err instanceof HttpException) {
          const status = err.getStatus();
          return throwError(
            () =>
              new HttpException(
                { status: 'error', message, error: err.getResponse() },
                status,
              ),
          );
        }
        return throwError(
          () =>
            new HttpException(
              { status: 'error', message, err },
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );
      }),
    );
  }
}
