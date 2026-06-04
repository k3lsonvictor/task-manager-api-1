import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { EventsService } from '../events/events.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: {
            create: jest.fn(),
            findMyProjects: jest.fn(),
            findProjectById: jest.fn(),
            updateProject: jest.fn(),
            deleteProject: jest.fn(),
            addMember: jest.fn(),
            findMembers: jest.fn(),
          },
        },
        {
          provide: EventsService,
          useValue: {
            streamProjectEvents: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
