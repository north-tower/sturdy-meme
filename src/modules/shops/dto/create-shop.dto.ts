import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShopDto {
  @ApiProperty({
    description: 'Shop name',
    example: 'Main Street Shop',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Shop location',
    example: 'Nairobi CBD',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description: 'M-Pesa paybill number',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  paybill?: string;

  @ApiProperty({
    description: 'M-Pesa till number',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  tillNumber?: string;

  @ApiProperty({
    description: 'Shop manager ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  managerId: string;

  @ApiProperty({
    description: 'B2B charges',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  b2bCharges?: number;
} 