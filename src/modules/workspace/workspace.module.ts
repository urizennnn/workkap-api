import { Module } from '@nestjs/common';
import { ClientModule } from './client/client.module';
import { FreelancerModule } from './freelancer/freelancer.module';
import { WorkspaceController } from './workspace.controller';

@Module({
  imports: [ClientModule, FreelancerModule],
  controllers: [WorkspaceController],
})
export class WorkspaceModule {}
