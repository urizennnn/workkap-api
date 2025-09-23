import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ErrorLoggingFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorLoggingFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const responseBody: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (typeof exceptionResponse === 'string') {
      responseBody.message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      Object.assign(responseBody, exceptionResponse);
    } else if (exception instanceof Error) {
      responseBody.message = exception.message;
      responseBody.error = exception.name;
    } else {
      responseBody.message = 'Internal server error';
    }

    if (!('message' in responseBody) || !responseBody.message) {
      responseBody.message = 'Internal server error';
    }

    this.logger.debug('Exception caught by filter:', exception);
    this.logger.error(
      `[Error] ${request.method} ${request.url} - ${status} - ${String(
        responseBody.message,
      )}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(responseBody);
  }
}
