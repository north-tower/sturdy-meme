import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ExternalApisService } from './external-apis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('External APIs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('external-apis')
export class ExternalApisController {
  constructor(private readonly externalApisService: ExternalApisService) {}

  @Post('kyc/verify')
  @ApiOperation({ summary: 'Verify KYC information' })
  @ApiResponse({ status: 200, description: 'KYC verification completed' })
  verifyKyc(@Body('idNumber') idNumber: string) {
    return this.externalApisService.verifyKyc(idNumber);
  }

  @Post('credit-score')
  @ApiOperation({ summary: 'Get credit score' })
  @ApiResponse({ status: 200, description: 'Credit score retrieved' })
  getCreditScore(@Body('idNumber') idNumber: string) {
    return this.externalApisService.getCreditScore(idNumber);
  }

  @Post('mpesa/payment')
  @ApiOperation({ summary: 'Initiate M-Pesa payment' })
  @ApiResponse({ status: 200, description: 'M-Pesa payment initiated' })
  initiateMpesaPayment(
    @Body() data: {
      phoneNumber: string;
      amount: number;
      accountReference: string;
    },
  ) {
    return this.externalApisService.initiateMpesaPayment(data);
  }
} 