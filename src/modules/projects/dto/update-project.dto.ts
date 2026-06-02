import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateProjectDto {
    @IsString()
    @MinLength(3)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
}