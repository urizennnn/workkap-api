import {
  Logger,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Response } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { RegistrationMethod } from '@prisma/client';
import { pickFrom } from './libs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UnifiedRedirectService {
  private readonly logger = new Logger(UnifiedRedirectService.name);
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    private readonly cfg: ConfigService,
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

      await this.cache.set(`ticket:${ticket}`, payload, ttlSeconds * 1000);

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
      throw new InternalServerErrorException('Failed to issue ticket redirect');
    }
  }

  async consumeTicket(ticket: string): Promise<any> {
    const key = `ticket:${ticket}`;
    const data = await this.cache.get(key);
    if (data) {
      if (data) await this.cache.del(key);
    } else {
      throw new NotFoundException('Invalid or expired ticket');
    }
    return data;
  }
}
