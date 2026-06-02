import { IsEmail, IsEnum } from "class-validator";

enum ProjectRole {
    ADMIN = "ADMIN",
    MEMBER = "MEMBER",
}

export class AddProjectMemberDto {
    @IsEmail()
    email: string;

    @IsEnum(ProjectRole)
    role: ProjectRole;
}