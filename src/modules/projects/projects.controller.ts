import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

type AuthenticatedRequest = Request & {
    user: {
        sub: string;
        email: string;
    }
}

@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) {}

    @Post()
    create(@Body() dto: CreateProjectDto, @Req() request: AuthenticatedRequest) {
        return this.projectsService.create(dto, request.user.sub)
    }

    @Get(":projectId")
    findProject(@Param("projectId") id: string, @Req() request: AuthenticatedRequest) {
        console.log(id, request.user.sub)
        return this.projectsService.findProjectById(id, request.user.sub)
    }

    @Get()
    findMyProjects(@Req() request: AuthenticatedRequest) {
        return this.projectsService.findMyProjects(request.user.sub)
    }

    @Patch(":id")
    editProject(@Body() dto: UpdateProjectDto, @Param("id") id: string, @Req() request: AuthenticatedRequest) {
        return this.projectsService.updateProject(dto, id, request.user.sub)
    }

    @Delete(':id')
    deleteProject(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
        return this.projectsService.deleteProject(id, request.user.sub);
    }

    @Get(':projectId/members')
    findMembers(
        @Param('projectId') projectId: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.projectsService.findMembers(projectId, request.user.sub);
    }
}
