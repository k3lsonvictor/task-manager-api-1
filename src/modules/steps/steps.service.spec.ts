import { Test, TestingModule } from "@nestjs/testing";
import { StepsService } from "./steps.service"
import { StepsRepository } from "./steps.repository";
import { ProjectsRepository } from "../projects/projects.repository";
import { ForbiddenException, NotFoundException } from "@nestjs/common";

describe('StepsService', () => {
    let service: StepsService;
    let stepsRepository: {
        create: jest.Mock;
        findStepsByPtoject: jest.Mock;
        findById: jest.Mock;
        update: jest.Mock;
        deleteStep: jest.Mock;
    };
    let projectsRepository: {
        findProjectById: jest.Mock;
        findMember: jest.Mock;
    };

    beforeEach(async () => {
        stepsRepository = {
            create: jest.fn(),
            findStepsByPtoject: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            deleteStep: jest.fn(),
        };

        projectsRepository = {
            findProjectById: jest.fn(),
            findMember: jest.fn(),
        }

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StepsService,
                {
                    provide: StepsRepository,
                    useValue: stepsRepository,
                },
                {
                    provide: ProjectsRepository,
                    useValue: projectsRepository,
                },
            ]
        }).compile();

        service = module.get<StepsService>(StepsService);
    });

    it('should be define', () => {
        expect(service).toBeDefined();
    });

    //Happy Test

    it('creates a step in a specific project', async () => {
        const project = {
            id: 'project-1',
            name: 'Projeto Teste',
            ownerId: 'user-1',
        };

        const step = {
            id: 'step-1',
            name: 'STEP',
            position: 1,
            projectId: 'project-1',
        };

        projectsRepository.findProjectById.mockResolvedValue(project);
        stepsRepository.create.mockResolvedValue(step);

        await expect(
            service.create(
                { name: 'STEP', position: 1 }, 'project-1', 'user-1',
            ),
        ).resolves.toEqual(step);

        expect(stepsRepository.create).toHaveBeenCalledWith({
            name: 'STEP',
            position: 1,
            projectId: 'project-1',
        });
    });

    //Test Error NotFoundException

    it('throws not found when trying to acess a missing step', async () => {
        projectsRepository.findProjectById.mockResolvedValue(null);

        await expect(
            service.findStepsByProject('project-1', 'user-1'),
        ).rejects.toThrow(NotFoundException);

        expect(projectsRepository.findMember).not.toHaveBeenCalled();
    });

    //Test Error ForbiddenExpection

    it('throws forbidden when the user is neither owner or member', async () => {
        projectsRepository.findProjectById.mockResolvedValue({
            id: 'project-1',
            ownerId: 'owner-1',
        });
        projectsRepository.findMember.mockResolvedValue(null);

        await expect(
            service.findStepById('step-1', 'project-1', 'user-1'),
        ).rejects.toThrow(ForbiddenException);
    });

    //

    it('allows an admin member to update a step', async () => {
        const updateStep = {
            id: 'step-1',
            name: 'New Step',
            position: 5,
        };
        stepsRepository.findById.mockResolvedValue({
            id: 'step-1',
        })
        projectsRepository.findProjectById.mockResolvedValue({
            id: 'project-1',
            ownerId: 'owner-1',
        });
        projectsRepository.findMember.mockResolvedValue({
            userId: 'admin-1',
            role: 'ADMIN',
        });
        stepsRepository.update.mockResolvedValue(updateStep);

        await expect(
            service.updateStep(
                { name: 'New Step', position: 5 },
                'step-1',
                'project-1',
                'admin-1'
            ),
        ).resolves.toEqual(updateStep);

        expect(stepsRepository.update).toHaveBeenCalledWith({
            id: 'step-1',
            name: 'New Step',
            position: 5,
        });

    })
})