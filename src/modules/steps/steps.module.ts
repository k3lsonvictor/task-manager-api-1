import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { StepsController } from './steps.controller';
import { StepsRepository } from './steps.repository';
import { StepsService } from './steps.service';

@Module({
  imports: [DatabaseModule, AuthModule, ProjectsModule],
  controllers: [StepsController],
  providers: [StepsService, StepsRepository],
  exports: [StepsService, StepsRepository],
})
export class StepsModule {}
