import { ApiProperty } from '@nestjs/swagger';

export class LogoutDto {
     @ApiProperty({
          description: 'User ID of the user logging out',
          example: 1,
     })
     userId!: number;
}