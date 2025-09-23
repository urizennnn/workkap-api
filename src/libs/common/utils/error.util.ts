import { HttpException } from '@nestjs/common';

type ExceptionFactory<T extends HttpException = HttpException> = (
  message: string,
  cause?: Error,
) => T;

export function normalizeAndThrowHttpError<T extends HttpException>(
  error: unknown,
  fallbackFactory: ExceptionFactory<T>,
  fallbackMessage: string,
): never {
  if (error instanceof HttpException) {
    throw error;
  }

  const cause = error instanceof Error ? error : undefined;
  const message = cause?.message ?? fallbackMessage;

  throw fallbackFactory(message, cause);
}
