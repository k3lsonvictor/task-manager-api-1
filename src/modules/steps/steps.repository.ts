import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class StepsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { name: string; position?: number; projectId: string }) {
    return this.prisma.step.create({
      data,
    });
  }

  findManyByProjectId(projectId: string) {
    return this.prisma.step.findMany({
      where: { projectId },
      include: {
        tasks: {
          orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findById(stepId: string, projectId: string) {
    return this.prisma.step.findFirst({
      where: {
        id: stepId,
        projectId,
      },
      include: {
        tasks: {
          orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        },
      },
    });
  }

  update(data: { id: string; name?: string; position?: number }) {
    return this.prisma.step.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.position !== undefined ? { position: data.position } : {}),
      },
    });
  }

  delete(stepId: string) {
    return this.prisma.step.delete({
      where: { id: stepId },
    });
  }
}
