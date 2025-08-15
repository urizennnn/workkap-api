import { Global, Module } from '@nestjs/common';

import { WorkkapLogger } from './logger';

@Global()
@Module({ providers: [WorkkapLogger], exports: [WorkkapLogger] })
export class LoggerModule {}
