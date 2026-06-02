import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateProjectDto {
    @IsString()
    @MinLength(3)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
}