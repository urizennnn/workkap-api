import { Module } from '@nestjs/common';
import { ClientModule } from './client/client.module';
import { FreelancerModule } from './freelancer/freelancer.module';
import { WorkspaceController } from './workspace.controller';
import { RegisterModule } from 'libs';

@Module({
  imports: [
    ClientModule,
    FreelancerModule,
    RegisterModule('workspace', [ClientModule, FreelancerModule]),
  ],
  controllers: [WorkspaceController],
})
export class WorkspaceModule {}
