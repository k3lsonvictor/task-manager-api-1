import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateStepDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
