import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateStepDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
