import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { ProjectsRepository } from '../projects/projects.repository';

type dtoCreateTask = {
    name: string;
    description?: string;
    stepId?: string;
    position?: number;
}

type dtoUpdateTask = {
    name?: string;
    description?: string;
    stepId?: string;
    position?: number;
}

@Injectable()
export class TasksService {
    constructor(
        private readonly tasksRepository: TasksRepository,
        private readonly projectsRepository: ProjectsRepository,
    ) {}

    private async assertCanManageProject(projectId: string, userId: string, taskId: string) {
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
            throw new ForbiddenException('You cannot modify this task in this project');
        }
    }

    create (data: dtoCreateTask, userId: string, projectId: string) {
        return this.tasksRepository.create({
            name: data.name,
            description: data.description,
            stepId: data.stepId,
            position: data.position,
            projectId,
            userCreatorId: userId,
        });
    }

    findTaksByProject(projectId: string) {
        return this.tasksRepository.findTasks(projectId);
    }

    findTaskById(taskId: string, projectId: string) {
        return this.tasksRepository.findTaskById(taskId, projectId);
    }

    async updateTask(data: dtoUpdateTask, creatorTaskId: string, projectId: string, taskId: string) {
        await this.assertCanManageProject(projectId, creatorTaskId, taskId);

        return this.tasksRepository.edit({
            name: data.name,
            description: data.description,
            stepId: data.stepId,
            position: data.position,
            id: taskId,
        })
    }

    async deleteTask(creatortaskId: string, projectId: string, taskId: string) {
        await this.assertCanManageProject(projectId, creatortaskId, taskId);

        return this.tasksRepository.delete(taskId);
    }
}
