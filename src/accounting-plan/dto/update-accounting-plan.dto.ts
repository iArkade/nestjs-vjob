import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateAccountingPlanDto } from "./create-accounting-plan.dto";
import { IsOptional, IsString, Matches } from "class-validator";

export class UpdateAccountingPlanDto extends PartialType(
  CreateAccountingPlanDto,
) {
  @ApiProperty({
    description: "The code of accounting plan",
    example: "1", // Parent account could be '1.', for example
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d+)*\.?$/, {
    message: "The code must follow the format 1., 1.1, etc.",
  })
  code?: string; // Optional field

  @ApiProperty({
    description: "The name of the accounting plan",
    example: "Activo",
  })
  @IsOptional()
  @IsString()
  name?: string; // Optional field
}
