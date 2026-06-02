import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsRepository } from '../projects/projects.repository';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { StepsRepository } from './steps.repository';

@Injectable()
export class StepsService {
  constructor(
    private readonly stepsRepository: StepsRepository,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  async create(dto: CreateStepDto, projectId: string, userId: string) {
    await this.assertCanManageProject(projectId, userId);

    return this.stepsRepository.create({
      name: dto.name,
      position: dto.position,
      projectId,
    });
  }

  async findStepsByProject(projectId: string, userId: string) {
    await this.assertProjectMember(projectId, userId);

    return this.stepsRepository.findManyByProjectId(projectId);
  }

  async findStepById(stepId: string, projectId: string, userId: string) {
    await this.assertProjectMember(projectId, userId);

    const step = await this.stepsRepository.findById(stepId, projectId);

    if (!step) {
      throw new NotFoundException('Step not found');
    }

    return step;
  }

  async updateStep(
    dto: UpdateStepDto,
    stepId: string,
    projectId: string,
    userId: string,
  ) {
    await this.assertCanManageProject(projectId, userId);
    await this.assertStepExists(stepId, projectId);

    return this.stepsRepository.update({
      id: stepId,
      name: dto.name,
      position: dto.position,
    });
  }

  async deleteStep(stepId: string, projectId: string, userId: string) {
    await this.assertCanManageProject(projectId, userId);
    await this.assertStepExists(stepId, projectId);

    return this.stepsRepository.delete(stepId);
  }

  private async assertProjectMember(projectId: string, userId: string) {
    const project = await this.projectsRepository.findProjectById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = await this.projectsRepository.findMember(projectId, userId);

    if (project.ownerId !== userId && !member) {
      throw new ForbiddenException('You are not a member of this project');
    }
  }

  private async assertCanManageProject(projectId: string, userId: string) {
    const project = await this.projectsRepository.findProjectById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = await this.projectsRepository.findMember(projectId, userId);
    const isOwner = project.ownerId === userId;
    const canManageByRole = member && ['OWNER', 'ADMIN'].includes(member.role);

    if (!isOwner && !canManageByRole) {
      throw new ForbiddenException('You cannot modify steps in this project');
    }
  }

  private async assertStepExists(stepId: string, projectId: string) {
    const step = await this.stepsRepository.findById(stepId, projectId);

    if (!step) {
      throw new NotFoundException('Step not found');
    }
  }
}
