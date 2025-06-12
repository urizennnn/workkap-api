import {
  Exclude,
  Expose,
  Transform,
  TransformFnParams,
} from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

@Exclude()
export class AppConfigSchema {
  @Expose({ name: 'PORT' })
  @IsNumber()
  port!: number;

  @Expose({ name: 'ALLOWED_ORIGINS' })
  @IsOptional()
  @IsArray()
  @Transform(({ value }: TransformFnParams): string[] | undefined => {
    if (typeof value === 'string' && value.length > 0) {
      return JSON.parse(value) as string[];
    }
    return value as string[] | undefined;
  })
  allowed_origins: string[] = [];

  @Expose({ name: 'DATABASE_URL' })
  @IsString()
  database_url!: string;

  @Expose({ name: 'JWT_SECRET' })
  @IsString()
  jwt_secret!: string;

  @Expose({ name: 'JWT_EXPIRES_IN' })
  @IsString()
  jwt_expires_in!: string;

  @Expose({ name: 'APP_NAME' })
  @IsOptional()
  @IsString()
  APP_NAME: string = 'OmniRelay API';

  @Expose({ name: 'NODE_ENV' })
  @IsOptional()
  @IsString()
  node_env?: string = 'development';

  @Expose({ name: 'LOG_LEVEL' })
  @IsOptional()
  @IsString()
  log_level: string = 'debug';

  @Expose({ name: 'JWT_REFRESH_EXPIRES_IN' })
  @IsString()
  jwt_refresh_expires_in!: string;
}
