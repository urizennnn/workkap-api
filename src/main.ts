import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  AllExceptionsFilter,
  FormatResponseInterceptor,
  SecurityHeadersInterceptor,
  WorkkapLogger,
} from 'libs';
import { SchemaValidatorInterceptor } from 'libs/common/interceptor/schema.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get(ConfigService);
  const logger = await app.resolve(WorkkapLogger);

  app.use(helmet());

  const allowedOrigins = config.get<string[]>('ALLOWED_ORIGINS') || [];
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
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
    new SchemaValidatorInterceptor(new Reflector()),
    new SecurityHeadersInterceptor(),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Workkap API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(config.get('port') ?? process.env.PORT ?? 3000);
}
void bootstrap();
