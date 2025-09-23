import {
  Logger,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Response } from 'express';
import { RegistrationMethod } from '@prisma/client';
import { pickFrom } from './libs';
import { ConfigService } from '@nestjs/config';
import { RedisService, normalizeAndThrowHttpError } from 'src/libs';

@Injectable()
export class UnifiedRedirectService {
  private readonly logger = new Logger(UnifiedRedirectService.name);
  constructor(
    private readonly cfg: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async issueTicketAndRedirect(
    res: Response,
    payload: any,
    provider: RegistrationMethod,
    opts?: { path?: string; extraQuery?: Record<string, string> },
  ): Promise<void> {
    try {
      const ticket = uuid();
      const ttlSeconds = 60;

      await this.redis.setJSON(`ticket:${ticket}`, payload, ttlSeconds);

      const base = pickFrom(this.cfg, 'client_base_url', 'app').replace(
        /\/+$/,
        '',
      );
      const path = '/auth/callback';
      const url = new URL(base + path);
      url.searchParams.set('ticket', ticket);
      url.searchParams.set('provider', provider);

      if (opts?.extraQuery) {
        for (const [k, v] of Object.entries(opts.extraQuery)) {
          url.searchParams.set(k, v);
        }
      }

      res.redirect(302, url.toString());
    } catch (err) {
      this.logger.error('Failed to issue ticket redirect', err);
      normalizeAndThrowHttpError(
        err,
        (message, cause) =>
          new InternalServerErrorException(
            message,
            cause ? { cause } : undefined,
          ),
        'Failed to issue ticket redirect',
      );
    }
  }

  async consumeTicket(ticket: string): Promise<any> {
    const key = `ticket:${ticket}`;
    const data = await this.redis.getJSON<any>(key);
    if (!data) {
      throw new NotFoundException('Invalid or expired ticket');
    }
    await this.redis.deleteKey(key);
    return data;
  }
}
