import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/database/prisma/prisma.service";

@Injectable()
export class ProjectsRepository {
    constructor(private readonly prisma: PrismaService) {}

    create(data: { name: string; description?: string; ownerId: string }) {
        return this.prisma.$transaction(async (tx) => {
            const project = await tx.project.create({ data });

            await tx.projectMember.create({
                data: {
                    projectId: project.id,
                    userId: data.ownerId,
                    role: "OWNER",
                },
            });
            return project;
        })
    }

    findManyByOwnerId(ownerId: string) {
        return this.prisma.project.findMany({
            where: {
                ownerId,
            },
            orderBy: {
                createdAt: "desc",
            }
        });
    }

    edit(data: { name: string; description?: string; id: string }) {
        return this.prisma.project.update({
            where: { id: data.id },
            data: {
                name: data.name,
                ...(data.description !== undefined ? { description: data.description } : {}),
            },
        });
    }

    deleteProject(id: string) {
        return this.prisma.project.delete({
            where: { id },
        });
    }

    findProjectById(projectId: string) {
        return this.prisma.project.findUnique({
            where: {id: projectId}
        })
    }

    findMember(projectId: string, userId: string) {
        return this.prisma.projectMember.findUnique({
            where: {
                userId_projectId: {
                    userId,
                    projectId,
                }
            }
        });
    }

    addMember(data: {
        projectId: string;
        userId: string;
        role: "ADMIN" | "MEMBER";
    }) {
        return this.prisma.projectMember.create({
            data,
        });
    }

    findMembers(projectId: string) {
        return this.prisma.projectMember.findMany({
            where: {projectId},
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                createdAt: "asc",
            }
        });
    }


}
