import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDeviceDto {
  @ApiProperty({
    description: 'Device SKU',
    example: 'IPHONE13-128-BLK',
  })
  @IsString()
  sku: string;

  @ApiProperty({
    description: 'Device brand',
    example: 'Apple',
  })
  @IsString()
  brand: string;

  @ApiProperty({
    description: 'Device model',
    example: 'iPhone 13',
  })
  @IsString()
  model: string;

  @ApiProperty({
    description: 'Device price',
    example: 999.99,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiProperty({
    description: 'Device IMEI',
    example: '123456789012345',
    required: false,
  })
  @IsOptional()
  @IsString()
  imei?: string;

  @ApiProperty({
    description: 'Supplier ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  supplierId: string;
} 