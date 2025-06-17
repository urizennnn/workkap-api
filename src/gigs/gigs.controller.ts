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
import { NeedsAuth, GigsDocs } from 'libs';
import type { AuthorizedRequest } from 'libs/@types/express';
import { GigSchemaType } from './dto';

@Controller('gigs')
@GigsDocs.controller
export class GigsController {
  constructor(private readonly gigsService: GigsService) {}

  @NeedsAuth()
  @Post('updateOrCreate')
  @GigsDocs.createGig
  async createGig(@Req() req: Request, @Body() data: GigSchemaType) {
    const userId = (req as AuthorizedRequest).user.userId;
    return this.gigsService.createGig(data, userId);
  }

  @NeedsAuth()
  @Get('fetch')
  @GigsDocs.getGigs
  async getGigs(@Req() req: Request) {
    const userId = (req as AuthorizedRequest).user.userId;
    return this.gigsService.fetchGigs(userId);
  }

  @NeedsAuth()
  @Get('get/:identifier')
  @GigsDocs.getGig
  async getGig(@Req() req: Request, @Param('identifier') identifier: string) {
    return this.gigsService.getGig(identifier);
  }
  @NeedsAuth()
  @Delete('delete/:identifier')
  @GigsDocs.deleteGig
  async deleteGig(
    @Req() req: Request,
    @Param('identifier') identifier: string,
  ) {
    const userId = (req as AuthorizedRequest).user.userId;
    return this.gigsService.deleteGig(identifier, userId);
  }
}
