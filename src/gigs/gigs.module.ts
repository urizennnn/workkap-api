import { Module } from '@nestjs/common';
import { GigsService } from './gigs.service';
import { GigsController } from './gigs.controller';
import { JWTService, SlugService } from 'libs';

@Module({
  imports: [],
  controllers: [GigsController],
  providers: [GigsService, SlugService, JWTService],
})
export class GigsModule {}
