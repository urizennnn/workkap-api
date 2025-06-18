import { Controller, Get } from '@nestjs/common';

@Controller()
export class WorkspaceController {
  @Get()
  getRoot() {
    return { message: 'workspace module' };
  }
}
