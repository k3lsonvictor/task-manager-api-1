// import { ConflictException, Injectable } from "@nestjs/common";
// import { CreateUserDto } from "../dto/create-user.dto";
// import { UsersRepository } from "../users.repository";
// import * as bcrypt from "bcrypt";

// @Injectable()
// export class CreateUserUseCase {
//     constructor(
//         private readonly usersRespository: UsersRepository,
//     ) { }

//     async execute(dto: CreateUserDto) {
//         const userAlreadyExists = await this.usersRespository.findByEmail(dto.email);

//         if (userAlreadyExists) {
//             throw new ConflictException('Email already registered');
//         }

//         const passwordHash = await bcrypt.hash(dto.password, 10);
//         const verificationCode
//     }
// }