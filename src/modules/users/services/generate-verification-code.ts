import { Injectable } from "@nestjs/common";
import { randomInt } from "crypto";

@Injectable()
export class GenerateVeficiationCode {
    execute () {
        return randomInt(100000, 1000000).toString();
    }
}