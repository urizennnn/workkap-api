import { Controller, Get } from '@nestjs/common';
import { WorkspaceDocs } from 'libs';

@Controller()
@WorkspaceDocs.controller
export class WorkspaceController {
  @Get()
  @WorkspaceDocs.getRoot
  getRoot() {
    return { message: 'workspace module' };
  }
}
