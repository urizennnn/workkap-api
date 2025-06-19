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
import { NeedsFreelancerAuth, GigsDocs, ValidateSchema } from 'libs';
import type { AuthorizedRequest } from 'libs/@types/express';
import { GigSchemaType, GigSchema } from './dto';

@Controller()
@GigsDocs.controller
export class GigsController {
  constructor(private readonly gigsService: GigsService) {}

  @GigsDocs.createGig
  @NeedsFreelancerAuth()
  @Post('updateOrCreate')
  @ValidateSchema({
    body: GigSchema,
  })
  async createGig(@Req() req: Request, @Body() data: GigSchemaType) {
    const userId = (req as AuthorizedRequest).user.userId;
    return this.gigsService.createGig(data, userId);
  }

  @GigsDocs.getGigs
  @NeedsFreelancerAuth()
  @Get('fetch')
  async getGigs(@Req() req: Request) {
    const userId = (req as AuthorizedRequest).user.userId;
    return this.gigsService.fetchGigs(userId);
  }

  @GigsDocs.getGig
  @NeedsFreelancerAuth()
  @Get('get/:identifier')
  async getGig(@Param('identifier') identifier: string) {
    return this.gigsService.getGig(identifier);
  }
  @NeedsFreelancerAuth()
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
