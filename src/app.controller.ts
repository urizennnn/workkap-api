import { Controller, Get } from '@nestjs/common';
import { AppControllerSwagger } from 'libs';
import { AppService } from './app.service';

@Controller()
@AppControllerSwagger.controller
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @AppControllerSwagger.getHello
  getHello(): string {
    return this.appService.getHello();
  }
}
