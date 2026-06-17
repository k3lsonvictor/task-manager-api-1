import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';
import { UsersRepository } from '../users/users.repository';
import { EventsService } from '../events/events.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectsRepository: {
    create: jest.Mock;
    findManyByOwnerId: jest.Mock;
    findProjectById: jest.Mock;
    findMember: jest.Mock;
    edit: jest.Mock;
    deleteProject: jest.Mock;
    addMember: jest.Mock;
    findMembers: jest.Mock;
  };
  let usersRepository: {
    findByEmail: jest.Mock;
  };
  let eventsService: {
    publishProjectEvent: jest.Mock;
  };

  beforeEach(async () => {
    projectsRepository = {
      create: jest.fn(),
      findManyByOwnerId: jest.fn(),
      findProjectById: jest.fn(),
      findMember: jest.fn(),
      edit: jest.fn(),
      deleteProject: jest.fn(),
      addMember: jest.fn(),
      findMembers: jest.fn(),
    };

    usersRepository = {
      findByEmail: jest.fn(),
    };

    eventsService = {
      publishProjectEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: ProjectsRepository,
          useValue: projectsRepository,
        },
        {
          provide: UsersRepository,
          useValue: usersRepository,
        },
        {
          provide: EventsService,
          useValue: eventsService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a project owned by the user and publishes an event', async () => {
    const project = {
      id: 'project-1',
      name: 'API',
      description: 'Task manager API',
      ownerId: 'user-1',
    };

    projectsRepository.create.mockResolvedValue(project);

    await expect(
      service.create(
        { name: 'API', description: 'Task manager API' },
        'user-1',
      ),
    ).resolves.toEqual(project);

    expect(projectsRepository.create).toHaveBeenCalledWith({
      name: 'API',
      description: 'Task manager API',
      ownerId: 'user-1',
    });
    expect(eventsService.publishProjectEvent).toHaveBeenCalledWith(
      'project-1',
      'project.created',
      project,
    );
  });

  it('throws not found when trying to access a missing project', async () => {
    projectsRepository.findProjectById.mockResolvedValue(null);

    await expect(
      service.findProjectById('project-1', 'user-1'),
    ).rejects.toThrow(NotFoundException);

    expect(projectsRepository.findMember).not.toHaveBeenCalled();
  });

  it('throws forbidden when the user is neither owner nor member', async () => {
    projectsRepository.findProjectById.mockResolvedValue({
      id: 'project-1',
      ownerId: 'owner-1',
    });
    projectsRepository.findMember.mockResolvedValue(null);

    await expect(
      service.findProjectById('project-1', 'user-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows an admin member to update a project', async () => {
    const updatedProject = {
      id: 'project-1',
      name: 'New name',
      description: 'New description',
      ownerId: 'owner-1',
    };

    projectsRepository.findProjectById.mockResolvedValue({
      id: 'project-1',
      ownerId: 'owner-1',
    });
    projectsRepository.findMember.mockResolvedValue({
      userId: 'admin-1',
      role: 'ADMIN',
    });
    projectsRepository.edit.mockResolvedValue(updatedProject);

    await expect(
      service.updateProject(
        { name: 'New name', description: 'New description' },
        'project-1',
        'admin-1',
      ),
    ).resolves.toEqual(updatedProject);

    expect(projectsRepository.edit).toHaveBeenCalledWith({
      id: 'project-1',
      name: 'New name',
      description: 'New description',
    });
    expect(eventsService.publishProjectEvent).toHaveBeenCalledWith(
      'project-1',
      'project.updated',
      updatedProject,
    );
  });
});
