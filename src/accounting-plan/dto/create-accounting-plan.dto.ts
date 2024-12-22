import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, Matches } from "class-validator";

export class CreateAccountingPlanDto {
  @ApiProperty({
    description: "The code of accounting plan",
    example: "1",
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+(\.\d+)*$/, {
    message: "The code must follow the format 1, 1.1, etc.",
  })
  code: string;

  @ApiProperty({
    description: "The name of the accounting plan",
    example: "Activo",
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: "The name of the company",
    example: "UDLA",
  })
  @IsNumber()
  @IsNotEmpty()
  empresa_id: number;
}
