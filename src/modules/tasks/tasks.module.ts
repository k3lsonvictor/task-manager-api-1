import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksRepository } from './tasks.repository';
import { EventsModule } from '../events/events.module';
import { StepsModule } from '../steps/steps.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ProjectsModule,
    StepsModule,
    EventsModule,
  ],
  providers: [TasksService, TasksRepository],
  controllers: [TasksController],
  exports: [TasksService, TasksRepository],
})
export class TasksModule {}
