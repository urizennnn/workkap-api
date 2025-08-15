import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class FormatResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (
          data &&
          typeof data === 'object' &&
          'status' in data &&
          'data' in data
        ) {
          const { message, data: payload } = data as {
            data: unknown;
            message?: string;
          } & Record<string, unknown>;
          return {
            status: 'success',
            message: message ?? 'Request successful',
            data: payload,
          };
        }
        return {
          status: 'success',
          message: 'Request successful',
          data,
        };
      }),
    );
  }
}
