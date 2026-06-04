import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { EventsService } from '../events/events.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: TasksRepository,
          useValue: {
            create: jest.fn(),
            findTasks: jest.fn(),
            findTaskById: jest.fn(),
            edit: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ProjectsRepository,
          useValue: {
            findProjectById: jest.fn(),
            findMember: jest.fn(),
          },
        },
        {
          provide: EventsService,
          useValue: {
            publishTaskEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
