import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateAccountingPlanDto {

     @ApiProperty({
          description: 'The code of accounting plan',
          example: '1',
     })
     @IsNotEmpty()
     @IsString()
     code: string;

     @ApiProperty({
          description: 'The name of the accounting plan',
          example: 'Activo',
     })
     @IsNotEmpty()
     @IsString()
     name: string;

     @ApiProperty({
          description: 'The name of the company',
          example: 'UDLA',
     })
     @IsNotEmpty()
     @IsString()
     readonly company_code: string;
}
