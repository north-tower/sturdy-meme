import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('sales')
export class SalesProcessor {
  private readonly logger = new Logger(SalesProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('process-sale')
  async handleSale(job: Job) {
    this.logger.debug('Processing sale...');
    const { saleId, loanId, deviceId, customerOtp, agentOtp } = job.data;

    try {
      // Implement sale processing logic here
      // This could include:
      // - Sending OTPs to customer and agent
      // - Updating device status
      // - Initiating loan disbursement
      this.logger.debug(`Processing sale ${saleId} for loan ${loanId} and device ${deviceId}...`);

      this.logger.debug('Sale processing completed');
    } catch (error) {
      this.logger.error('Error processing sale:', error);
      throw error;
    }
  }
} 