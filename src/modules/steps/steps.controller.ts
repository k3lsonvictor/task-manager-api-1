import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { StepsService } from './steps.service';

type AuthenticatedRequest = Request & {
  user: {
    sub: string;
    email: string;
  };
};

@Controller('steps')
export class StepsController {
  constructor(private readonly stepsService: StepsService) {}

  @Post(':projectId')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateStepDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.stepsService.create(dto, projectId, request.user.sub);
  }

  @Get(':projectId')
  findStepsByProject(
    @Param('projectId') projectId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.stepsService.findStepsByProject(projectId, request.user.sub);
  }

  @Get(':projectId/:stepId')
  findStepById(
    @Param('projectId') projectId: string,
    @Param('stepId') stepId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.stepsService.findStepById(stepId, projectId, request.user.sub);
  }

  @Patch(':projectId/:stepId')
  updateStep(
    @Param('projectId') projectId: string,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateStepDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.stepsService.updateStep(dto, stepId, projectId, request.user.sub);
  }

  @Delete(':projectId/:stepId')
  deleteStep(
    @Param('projectId') projectId: string,
    @Param('stepId') stepId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.stepsService.deleteStep(stepId, projectId, request.user.sub);
  }
}
