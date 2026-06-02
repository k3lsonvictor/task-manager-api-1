import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class ProjectsService {
    constructor(
        private readonly projectsRepository: ProjectsRepository,
        private readonly usersRepository: UsersRepository,
    ) {}

    create(dto: CreateProjectDto, ownerId: string) { //criar projeto
        return this.projectsRepository.create({
            name: dto.name,
            description: dto.description,
            ownerId, //vincular criardor como dono do projeto
        });
    }

    findMyProjects(userId: string) { //listar projetos por usuário
        return this.projectsRepository.findManyByOwnerId(userId);
    }

    async findProjectById(projectId: string, userId: string){ //buscar projeto por id
        const project = await this.projectsRepository.findProjectById(projectId);

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        const member = await this.projectsRepository.findMember(projectId, userId);

        if (project.ownerId !== userId && !member) {
            throw new ForbiddenException('You cannot access this project');
        }

        return project;
    }

    async updateProject(dto: UpdateProjectDto, projectId: string, userId: string) {
        await this.assertCanManageProject(projectId, userId);

        return this.projectsRepository.edit({
            name: dto.name,
            description: dto.description,
            id: projectId,
        });
    }

    async deleteProject(id: string, userId: string) {
        await this.assertCanManageProject(id, userId);

        return this.projectsRepository.deleteProject(id);
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
            throw new ForbiddenException('You cannot modify this project');
        }
    }

    async addMember(
        projectId: string,
        requesterId: string,
        dto: AddProjectMemberDto,
    ) {
        const project = await this.projectsRepository.findProjectById(projectId);

        if(!project) {
            throw new NotFoundException("Project not found");
        }

        const requesterMember = await this.projectsRepository.findMember(
            projectId,
            requesterId,
        );
        const isOwner = project.ownerId === requesterId;
        const canManageByRole = requesterMember && ["OWNER", "ADMIN"].includes(requesterMember.role);

        if(!isOwner && !canManageByRole) {
            throw new ForbiddenException("You cannot add member to this project");
        }

        const userToAdd = await this.usersRepository.findByEmail(dto.email);

        if(!userToAdd) {
            throw new NotFoundException("User not found");
        }

        return this.projectsRepository.addMember({
            projectId,
            userId: userToAdd.id,
            role: dto.role,
        });
    }

    async findMembers(projectId: string, requesterId: string) {
        const requesterMember = await this.projectsRepository.findMember(projectId, requesterId);

        if(!requesterMember) {
            throw new ForbiddenException("You are not a member of this project");
        }

        return this.projectsRepository.findMembers(projectId);
    }
}
