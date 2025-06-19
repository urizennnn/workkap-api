import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { AppConfigSchema } from './app.schema';
import { validateSync } from 'class-validator';

export const appConfigFactory = registerAs('app', () => {
  const env = plainToInstance(AppConfigSchema, process.env, {
    excludeExtraneousValues: true,
    enableImplicitConversion: true,
    exposeUnsetFields: false,
  });

  const errors = validateSync(env, { whitelist: true });

  if (errors.length > 0) throw new Error(errors.toString());

  const database = new URL(env.database_url);
  const databaseName = database.pathname.replace(/^\/+/, '');
  return {
    app_name: env.APP_NAME,
    log_level: env.log_level,
    status: env.node_env,
    port: (env.port || 4000) as 4000,
    jwt: {
      secret: env.jwt_secret,
      expires_in: env.jwt_expires_in,
      refresh_expires_in: env.jwt_refresh_expires_in,
    },
    db: {
      url: env.database_url,
      href: database.href,
      host: database.hostname,
      username: database.username,
      password: database.password,
      pathname: databaseName,
      port: database.port,
    },
    google: {
      client_id: env.google_client_id,
      client_secret: env.google_client_secret,
      callback_url: env.google_callback_url,
    },
    redis: {
      url: env.redis_url,
    },
  } as const;
});

export type AppConfig = ReturnType<typeof appConfigFactory>;

export * from './utils';
