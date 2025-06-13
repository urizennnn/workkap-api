import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { FormatResponseInterceptor } from 'libs/common/interceptor';
import { AllExceptionsFilter } from 'libs/common/filter';
import { WorkkapLogger } from 'libs/common/logger';
import { SecurityHeadersInterceptor } from 'libs/common/interceptor/security-headers.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get(ConfigService);
  const logger = await app.resolve(WorkkapLogger);

  app.use(helmet());

  const allowedOrigins = config.get<string[]>('ALLOWED_ORIGINS') || [];
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : undefined,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(
    new FormatResponseInterceptor(),
    new SecurityHeadersInterceptor(),
  );

  await app.listen(config.get('port') ?? process.env.PORT ?? 3000);
}
void bootstrap();
