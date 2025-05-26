import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, Matches, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'User ID number',
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  idNumber: string;

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
    description: 'User email',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

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