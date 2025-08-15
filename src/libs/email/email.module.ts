import { Global, Module } from '@nestjs/common';
import { SengridService } from './sengrid.service';

@Global()
@Module({
  providers: [SengridService],
  exports: [SengridService],
})
export class EmailModule {}
