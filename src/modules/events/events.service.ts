import { Injectable } from '@nestjs/common';
import { filter, Observable, Subject } from 'rxjs';

export type TaskEventType = 'task.created' | 'task.updated' | 'task.deleted';
export type StepEventType = 'step.created' | 'step.updated' | 'step.deleted';
export type ProjectEventType = 'project.created' | 'project.updated' | 'project.deleted';
export type AllProjectEventTypes = TaskEventType | StepEventType | ProjectEventType;

export type ProjectEvent = {
  id: string;
  projectId: string;
  type: AllProjectEventTypes;
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

  publishProjectEvent(
    projectId: string,
    type: ProjectEventType,
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
