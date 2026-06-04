import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { EventsService } from '../events/events.service';

type dtoCreateTask = {
  name: string;
  description?: string;
  stepId?: string;
  position?: number;
};

type dtoUpdateTask = {
  name?: string;
  description?: string;
  stepId?: string;
  position?: number;
};

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly eventsService: EventsService,
  ) {}

  private async assertCanManageProject(
    projectId: string,
    userId: string,
    taskId: string,
  ) {
    const task = await this.tasksRepository.findTaskById(taskId, projectId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const project = await this.projectsRepository.findProjectById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = await this.projectsRepository.findMember(projectId, userId);

    const isProjectOwner = project.ownerId === userId;
    const canManageByRole = member && ['OWNER', 'ADMIN'].includes(member.role);
    const isTaskCreator = userId === task.userCreatorId;

    if (!isProjectOwner && !canManageByRole && !isTaskCreator) {
      throw new ForbiddenException(
        'You cannot modify this task in this project',
      );
    }
  }

  async create(data: dtoCreateTask, userId: string, projectId: string) {
    const task = await this.tasksRepository.create({
      name: data.name,
      description: data.description,
      stepId: data.stepId,
      position: data.position,
      projectId,
      userCreatorId: userId,
    });

    this.eventsService.publishTaskEvent(projectId, 'task.created', task);

    return task;
  }

  findTaksByProject(projectId: string) {
    return this.tasksRepository.findTasks(projectId);
  }

  findTaskById(taskId: string, projectId: string) {
    return this.tasksRepository.findTaskById(taskId, projectId);
  }

  async updateTask(
    data: dtoUpdateTask,
    creatorTaskId: string,
    projectId: string,
    taskId: string,
  ) {
    await this.assertCanManageProject(projectId, creatorTaskId, taskId);

    const task = await this.tasksRepository.edit({
      name: data.name,
      description: data.description,
      stepId: data.stepId,
      position: data.position,
      id: taskId,
    });

    this.eventsService.publishTaskEvent(projectId, 'task.updated', task);

    return task;
  }

  async deleteTask(creatortaskId: string, projectId: string, taskId: string) {
    await this.assertCanManageProject(projectId, creatortaskId, taskId);

    const task = await this.tasksRepository.delete(taskId);

    this.eventsService.publishTaskEvent(projectId, 'task.deleted', task);

    return task;
  }
}
