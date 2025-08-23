import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { WorkkapLogger } from 'src/libs/common/logger/logger';

const MAX_RETRIES = 5;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly logger: WorkkapLogger) {
    super();
  }
  private retries = 0;

  async onModuleInit() {
    this.logger.info('Connecting to the database...');
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    this.logger.info('Disconnecting from the database...');
    await this.$disconnect();
    this.logger.info('Database disconnected 🚫');
  }

  private async connectWithRetry(): Promise<void> {
    try {
      await this.$connect();
      this.logger.info('Database connected ✅');
    } catch (error) {
      this.retries++;
      this.logger.error(
        `Failed to connect to the database (Attempt ${this.retries}/${MAX_RETRIES})`,
        error,
      );

      if (this.retries < MAX_RETRIES) {
        this.logger.info('Retrying database connection...');
        await new Promise((resolve) => setTimeout(resolve, 6000));
        return this.connectWithRetry();
      }

      this.logger.error(
        'Exceeded maximum retries. Could not connect to the database.',
        error,
      );
      throw error;
    }
  }
}
