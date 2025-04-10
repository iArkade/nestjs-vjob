import { IsNumber, IsString } from "class-validator";

export class CreateLoginHistoryDto {
     @IsNumber()
     userId!: number;

     @IsString()
     userName!: string;
}
