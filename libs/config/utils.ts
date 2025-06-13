import { ConfigService } from '@nestjs/config';
import { AppConfig } from './index';

export type ExcludeArrayKeys<T> =
  T extends ArrayLike<any> ? Exclude<keyof T, keyof any[]> : keyof T;

export type IsAny<T> = unknown extends T
  ? [keyof T] extends [never]
    ? false
    : true
  : false;

type PathImpl<T, Key extends keyof T> = Key extends string
  ? IsAny<T[Key]> extends true
    ? never
    : NonNullable<T[Key]> extends Record<string, any>
      ?
          | `${Key}.${PathImpl<T[Key], ExcludeArrayKeys<T[Key]>> & string}`
          | `${Key}.${ExcludeArrayKeys<T[Key]> & string}`
      : never
  : never;

type PathImpl2<T> = PathImpl<T, keyof T> | keyof T;

export type Path<T> = keyof T extends string
  ? PathImpl2<T> extends infer P
    ? P extends string | keyof T
      ? P
      : keyof T
    : keyof T
  : never;

export type Choose<
  T extends Record<string | number, any>,
  K extends Path<T>,
> = K extends `${infer U}.${infer Rest}`
  ? Rest extends Path<T[U]>
    ? Choose<T[U], Rest>
    : never
  : T[K];

export type AnyString = string & {};
export type StringEnum<T extends string> = T | AnyString;
type NS = 'app';
type Paths = Path<AppConfig>;
type Chosen<P extends Paths> = Choose<AppConfig, Extract<P, Path<AppConfig>>>;

export function pickFromApp<P extends Path<AppConfig>>(
  config: ConfigService,
  path: P,
): Choose<AppConfig, P> {
  return config.getOrThrow(path);
}

export function pickFrom<P extends Path<AppConfig>>(
  c: ConfigService,
  p: P,
  n: 'app',
): Choose<AppConfig, P>;
export function pickFrom<P extends Path<AppConfig>>(
  c: ConfigService,
  p: P,
): Choose<AppConfig, P>;
export function pickFrom<P extends Paths>(
  config: ConfigService,
  path: P,
  ns?: StringEnum<NS>,
): Chosen<P> {
  switch (ns) {
    case 'app':
      return config.getOrThrow(`${ns}.${path}`);
    case undefined:
      return config.getOrThrow(path);
    default:
      throw new Error(`Unknown namespace: ${ns}`);
  }
}
