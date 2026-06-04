import { Injectable } from '@nestjs/common';
import { filter, Observable, Subject } from 'rxjs';

export type TaskEventType = 'task.created' | 'task.updated' | 'task.deleted';

export type ProjectEvent = {
  id: string;
  projectId: string;
  type: TaskEventType;
  data: unknown;
  createdAt: string;
};

@Injectable()
export class EventsService {
  private readonly projectEvents$ = new Subject<ProjectEvent>();

  publishTaskEvent(
    projectId: string,
    type: TaskEventType,
    data: unknown,
  ): ProjectEvent {
    const event = {
      id: crypto.randomUUID(),
      projectId,
      type,
      data,
      createdAt: new Date().toISOString(),
    };

    // console.log('event', event);
    this.projectEvents$.next(event);

    return event;
  }

  streamProjectEvents(projectId: string): Observable<ProjectEvent> {
    return this.projectEvents$.pipe(
      filter((event) => event.projectId === projectId),
    );
  }
}
