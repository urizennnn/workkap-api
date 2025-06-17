import { Request } from 'express';
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import * as v from 'valibot';
import { ValiError } from 'valibot';
import {
  SCHEMA_KEY,
  SchemaMap,
  VSchema,
} from '../decorators/validateSchema.decorator';

@Injectable()
export class SchemaValidatorInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & Record<string, unknown>>();
    const schemas =
      this.reflector.get<SchemaMap>(SCHEMA_KEY, ctx.getHandler()) ||
      this.reflector.get<SchemaMap>(SCHEMA_KEY, ctx.getClass());

    if (schemas) {
      this.applyValidations(req, schemas);
    }

    return next.handle();
  }

  private applyValidations(
    req: Request & Record<string, unknown>,
    maps: SchemaMap,
  ): void {
    for (const part of ['body', 'query', 'params', 'custom'] as const) {
      const schemaDef = maps[part];
      if (!schemaDef) continue;

      if (part === 'custom') {
        (schemaDef as (r: Request) => void)(req);
        continue;
      }

      const raw: string = req[part] as string;
      const schemas = Array.isArray(schemaDef)
        ? schemaDef
        : ([schemaDef] as VSchema[]);
      const merged = schemas.length > 1 ? v.intersect(schemas) : schemas[0];

      try {
        const parsed: unknown = v.parse(merged, raw);
        req[part] = parsed;
      } catch (error) {
        if (v.isValiError(error)) {
          throw new BadRequestException({
            message: 'Validation failed',
            errors: this.formatValibotErrors(error),
          });
        }
        throw error;
      }
    }
  }

  private formatValibotErrors(
    err: ValiError<any>,
  ): Array<{ path: string; message: string }> {
    return err.issues.map((i) => ({
      path: i.path.join('.') || '<root>',
      message: i.message,
    }));
  }
}
