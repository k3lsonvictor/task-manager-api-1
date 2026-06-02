import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type AuthenticatedRequest = Request & {
    user: {
        sub: string;
        email: string;
    }
}

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Post(":projectId")
    create(@Param("projectId") projectId: string, @Body() dto: CreateTaskDto, @Req() request: AuthenticatedRequest) {
        return this.tasksService.create(dto, request.user.sub, projectId);
    }

    @Get(":projectId")
    findTasksByProject(@Param("projectId") projectId: string) {
        return this.tasksService.findTaksByProject(projectId);
    }

    @Get(":projectId/:taskId")
    findTaskById(@Param("projectId") projectId: string, @Param("taskId") taskId: string) {
        return this.tasksService.findTaskById(taskId, projectId);
    }

    @Patch(":projectId/:taskId")
    updateTask(
        @Param("projectId") projectId: string,
        @Param("taskId") taskId: string,
        @Body() dto: UpdateTaskDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.tasksService.updateTask(dto, request.user.sub, projectId, taskId);
    }

    @Delete(":projectId/:taskId")
    deleteTask(
        @Param("projectId") projectId: string,
        @Param("taskId") taskId: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.tasksService.deleteTask(request.user.sub, projectId, taskId);
    }
}
