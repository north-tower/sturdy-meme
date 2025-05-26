import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User phone number',
    example: '+254712345678',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+254[0-9]{9}$/, {
    message: 'Phone number must be in format +254XXXXXXXXX',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'User PIN',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{4,6}$/, {
    message: 'PIN must be 4-6 digits',
  })
  pin: string;
} 