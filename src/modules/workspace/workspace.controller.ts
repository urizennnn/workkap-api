import { Controller, Get } from '@nestjs/common';

@Controller('workspace')
export class WorkspaceController {
  @Get()
  getRoot() {
    return { message: 'workspace module' };
  }
}
