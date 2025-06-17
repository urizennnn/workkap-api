import { SetMetadata } from '@nestjs/common';
import * as v from 'valibot';

export type VSchema = v.BaseSchema<unknown, any, any>;

export interface SchemaMap {
  body?: VSchema | VSchema[];
  query?: VSchema | VSchema[];
  params?: VSchema | VSchema[];
  custom?: (req: any) => unknown;
}

export const SCHEMA_KEY = 'schema_validation';

export const ValidateSchema = (schemas: SchemaMap) =>
  SetMetadata(SCHEMA_KEY, schemas);
