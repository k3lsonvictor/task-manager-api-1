import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom } from 'rxjs';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('streams only events from the requested project', async () => {
    const eventPromise = firstValueFrom(
      service.streamProjectEvents('project-1'),
    );

    service.publishTaskEvent('project-2', 'task.created', { id: 'task-2' });
    service.publishTaskEvent('project-1', 'task.created', { id: 'task-1' });

    await expect(eventPromise).resolves.toMatchObject({
      projectId: 'project-1',
      type: 'task.created',
      data: { id: 'task-1' },
    });
  });
});
