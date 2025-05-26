import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleDto {
  @ApiProperty({
    description: 'Loan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  loanId: string;

  @ApiProperty({
    description: 'Sales agent ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @ApiProperty({
    description: 'Shop ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @ApiProperty({
    description: 'Customer OTP',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  customerOtp: string;

  @ApiProperty({
    description: 'Agent OTP',
    example: '654321',
  })
  @IsString()
  @IsNotEmpty()
  agentOtp: string;

  @ApiProperty({
    description: 'Deposit amount',
    example: 1000,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  depositAmount: number;

  @ApiProperty({
    description: 'Device IMEI',
    example: '123456789012345',
  })
  @IsString()
  @IsNotEmpty()
  deviceImei: string;
} 