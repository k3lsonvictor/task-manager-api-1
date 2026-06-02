import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/database/prisma/prisma.service";

@Injectable()
export class TasksRepository {
    constructor(private readonly prismaService: PrismaService) {}

    create (data: { name: string; description?: string; position?: number; projectId: string; stepId?: string; userCreatorId: string}) {
        return this.prismaService.task.create({data});
    }

    findTasks (projectId: string) {
        return this.prismaService.task.findMany({
            where:{projectId},
            orderBy: [
                { stepId: "asc" },
                { position: "asc" },
                { createdAt: "desc" },
            ],
        })
    }

    findTasksByCreatorId (creatorTasksId: string) {
        return this.prismaService.task.findMany({
            where: {
                userCreatorId: creatorTasksId,
            },
            orderBy: [
                { stepId: "asc" },
                { position: "asc" },
                { createdAt: "desc" },
            ],
        })
    }

    findTaskById (taskId: string, projectId: string) {
        return this.prismaService.task.findFirst({
            where:{
                id: taskId,
                projectId,
            }
        })
    }

    edit (data: { name?: string; description?: string; position?: number; stepId?: string; id: string}) {
        return this.prismaService.task.update({
            where: {
                id: data.id,
            },
            data:{
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.description !== undefined ? { description: data.description } : {}),
                ...(data.position !== undefined ? { position: data.position } : {}),
                ...(data.stepId !== undefined ? { stepId: data.stepId } : {}),
            }
        })
    }

    delete (taskId: string) {
        return this.prismaService.task.delete({
            where: {id: taskId}
        })
    }
}
