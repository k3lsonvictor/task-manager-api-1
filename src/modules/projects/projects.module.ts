import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectsRepository } from './projects.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [DatabaseModule, AuthModule, UsersModule],
  providers: [ProjectsService, ProjectsRepository],
  controllers: [ProjectsController],
  exports: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}
