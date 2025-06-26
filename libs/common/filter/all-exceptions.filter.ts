import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WorkkapLogger } from '../logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: WorkkapLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, body } = this.normalizeException(exception);
    this.logger.error(`${request.method} ${request.url}`, exception);
    response.status(status).json(body);
  }

  private normalizeException(exception: unknown): {
    status: number;
    body: Record<string, unknown>;
  } {
    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      const status = exception.getStatus();
      if (typeof resp === 'string') {
        return { status, body: { status: 'error', message: resp } };
      }
      return {
        status,
        body: { status: 'error', ...(resp as Record<string, unknown>) },
      };
    }
    const message =
      exception instanceof Error ? exception.message : 'Internal server error';
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { status: 'error', message },
    };
  }
}
