import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { StepsModule } from './modules/steps/steps.module';

@Module({
  imports: [
    ConfigModule.forRoot({
    isGlobal: true,
  }),
  DatabaseModule, UsersModule, AuthModule, ProjectsModule, TasksModule, StepsModule],
  controllers: [AppController],
  providers: [{
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },AppService],
})
export class AppModule {}
