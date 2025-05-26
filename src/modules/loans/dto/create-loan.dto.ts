import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLoanDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Device ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({
    description: 'Loan amount',
    example: 1000,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Interest rate (annual)',
    example: 0.12,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  interestRate: number;

  @ApiProperty({
    description: 'Loan tenure in months',
    example: 12,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  tenure: number;
} 