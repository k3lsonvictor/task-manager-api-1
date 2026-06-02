import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  stepId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
