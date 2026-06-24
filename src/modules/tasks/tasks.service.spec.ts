import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { EventsService } from '../events/events.service';
import { StepsRepository } from '../steps/steps.repository';

describe('TasksService', () => {
  let service: TasksService;
  let tasksRepository: {
    create: jest.Mock;
    findTasks: jest.Mock;
    findTaskById: jest.Mock;
    edit: jest.Mock;
    delete: jest.Mock;
  };
  let projectsRepository: {
    findProjectById: jest.Mock;
    findMember: jest.Mock;
  };
  let stepsRepository: {
    findById: jest.Mock;
  };
  let eventsService: {
    publishTaskEvent: jest.Mock;
  };

  beforeEach(async () => {
    tasksRepository = {
      create: jest.fn(),
      findTasks: jest.fn(),
      findTaskById: jest.fn(),
      edit: jest.fn(),
      delete: jest.fn(),
    };
    projectsRepository = {
      findProjectById: jest.fn(),
      findMember: jest.fn(),
    };
    stepsRepository = {
      findById: jest.fn(),
    };
    eventsService = {
      publishTaskEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: TasksRepository,
          useValue: tasksRepository,
        },
        {
          provide: ProjectsRepository,
          useValue: projectsRepository,
        },
        {
          provide: StepsRepository,
          useValue: stepsRepository,
        },
        {
          provide: EventsService,
          useValue: eventsService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('denies listing tasks to a user outside the project', async () => {
    projectsRepository.findProjectById.mockResolvedValue({
      id: 'project-1',
      ownerId: 'owner-1',
    });
    projectsRepository.findMember.mockResolvedValue(null);

    await expect(
      service.findTasksByProject('project-1', 'outsider-1'),
    ).rejects.toThrow(ForbiddenException);

    expect(tasksRepository.findTasks).not.toHaveBeenCalled();
  });

  it('denies creating a task to a user outside the project', async () => {
    projectsRepository.findProjectById.mockResolvedValue({
      id: 'project-1',
      ownerId: 'owner-1',
    });
    projectsRepository.findMember.mockResolvedValue(null);

    await expect(
      service.create({ name: 'Unauthorized task' }, 'outsider-1', 'project-1'),
    ).rejects.toThrow(ForbiddenException);

    expect(tasksRepository.create).not.toHaveBeenCalled();
  });

  it('allows a project member to create a task', async () => {
    const task = {
      id: 'task-1',
      name: 'Authorized task',
      projectId: 'project-1',
      userCreatorId: 'member-1',
    };
    projectsRepository.findProjectById.mockResolvedValue({
      id: 'project-1',
      ownerId: 'owner-1',
    });
    projectsRepository.findMember.mockResolvedValue({
      userId: 'member-1',
      role: 'MEMBER',
    });
    tasksRepository.create.mockResolvedValue(task);

    await expect(
      service.create({ name: task.name }, 'member-1', 'project-1'),
    ).resolves.toEqual(task);
  });

  it('rejects a step from another project when creating a task', async () => {
    projectsRepository.findProjectById.mockResolvedValue({
      id: 'project-1',
      ownerId: 'owner-1',
    });
    projectsRepository.findMember.mockResolvedValue({
      userId: 'member-1',
      role: 'MEMBER',
    });
    stepsRepository.findById.mockResolvedValue(null);

    await expect(
      service.create(
        { name: 'Task', stepId: 'step-from-project-2' },
        'member-1',
        'project-1',
      ),
    ).rejects.toThrow(NotFoundException);

    expect(stepsRepository.findById).toHaveBeenCalledWith(
      'step-from-project-2',
      'project-1',
    );
    expect(tasksRepository.create).not.toHaveBeenCalled();
  });

  it('denies updates by a former project member even if they created the task', async () => {
    projectsRepository.findProjectById.mockResolvedValue({
      id: 'project-1',
      ownerId: 'owner-1',
    });
    projectsRepository.findMember.mockResolvedValue(null);

    await expect(
      service.updateTask(
        { name: 'Changed' },
        'former-member-1',
        'project-1',
        'task-1',
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(tasksRepository.findTaskById).not.toHaveBeenCalled();
    expect(tasksRepository.edit).not.toHaveBeenCalled();
  });
});
