import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Loan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  loanId: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 100,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.MPESA,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Transaction reference',
    example: 'MPESA123456',
  })
  @IsString()
  transactionRef: string;
} 