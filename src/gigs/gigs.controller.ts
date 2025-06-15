import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { GigsService } from './gigs.service';
import { Gig } from '@prisma/client';
import { NeedsAuth } from 'libs';

@Controller('gigs')
export class GigsController {
  constructor(private readonly gigsService: GigsService) {}

  @NeedsAuth()
  @Post('updateOrCreate')
  async createGig(
    @Req() req: Request,
    @Body() data: Omit<Gig, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    const userId = req.user.userId;
    return this.gigsService.createGig(data, userId);
  }

  @NeedsAuth()
  @Get('fetch')
  async getGigs(@Req() req: Request) {
    const userId = req.user.userId;
    return this.gigsService.fetchGigs(userId);
  }

  @NeedsAuth()
  @Get('get/:identifier')
  async getGig(@Req() req: Request, @Param('identifier') identifier: string) {
    return this.gigsService.getGig(identifier);
  }
  @NeedsAuth()
  @Delete('delete/:identifier')
  async deleteGig(
    @Req() req: Request,
    @Param('identifier') identifier: string,
  ) {
    const userId = req.user.userId;
    return this.gigsService.deleteGig(identifier, userId);
  }
}
