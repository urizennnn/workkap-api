import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { WorkkapLogger } from 'libs/common/logger';
import { ConfigService } from '@nestjs/config';
import { pickFrom } from 'libs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly url: string;
  constructor(
    private readonly config: ConfigService,
    private readonly logger: WorkkapLogger,
  ) {
    this.url = pickFrom(this.config, 'redis.url', 'app');
    this.client = new Redis(this.url);
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  private async connectWithRetry(retries = 3): Promise<void> {
    try {
      await this.client.ping();
      this.logger.info('Redis connected ✅');
    } catch (err) {
      this.logger.error('Failed to connect to Redis', err);
      if (retries > 0) {
        await new Promise((res) => setTimeout(res, 2000));
        return this.connectWithRetry(retries - 1);
      }
      throw err;
    }
  }

  async cacheMessage(name: string, message: any, retries = 3): Promise<void> {
    try {
      await this.client.rpush(`conv:${name}`, JSON.stringify(message));
    } catch (err) {
      this.logger.error('Failed to cache message', err);
      if (retries > 0) return this.cacheMessage(name, message, retries - 1);
    }
  }

  async getMessages(name: string): Promise<any[]> {
    const res = await this.client.lrange(`conv:${name}`, 0, -1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return res.map((item) => JSON.parse(item));
  }

  async storeOtp(userId: string, otp: string, ttl = 300, prefix = 'otp'): Promise<void> {
    await this.client.set(`${prefix}:${userId}`, otp, 'EX', ttl);
  }

  async getOtp(userId: string, prefix = 'otp'): Promise<string | null> {
    return this.client.get(`${prefix}:${userId}`);
  }

  async deleteOtp(userId: string, prefix = 'otp'): Promise<void> {
    await this.client.del(`${prefix}:${userId}`);
  }
}
