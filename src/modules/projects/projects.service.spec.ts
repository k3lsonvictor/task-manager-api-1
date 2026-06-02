import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';
import { UsersRepository } from '../users/users.repository';

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: ProjectsRepository,
          useValue: {
            create: jest.fn(),
            findManyByOwnerId: jest.fn(),
            findProjectById: jest.fn(),
            findMember: jest.fn(),
            edit: jest.fn(),
            deleteProject: jest.fn(),
            addMember: jest.fn(),
            findMembers: jest.fn(),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
