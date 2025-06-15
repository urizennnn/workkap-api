import { Module } from '@nestjs/common';
import { GigsService } from './gigs.service';
import { GigsController } from './gigs.controller';

@Module({
  imports: [],
  controllers: [GigsController],
  providers: [GigsService],
})
export class GigsModule {}
