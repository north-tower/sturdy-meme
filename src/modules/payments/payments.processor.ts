import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

@Processor('payments')
export class PaymentsProcessor {
  private readonly logger = new Logger(PaymentsProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('process-payment')
  async handlePayment(job: Job) {
    this.logger.debug('Processing payment...');
    const { paymentId, amount, paymentMethod, transactionRef } = job.data;

    try {
      if (paymentMethod === PaymentMethod.MPESA) {
        // Implement M-Pesa STK Push logic here
        // This would typically involve calling the M-Pesa API
        this.logger.debug('Initiating M-Pesa STK Push...');
      }

      // Update payment status
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PENDING,
        },
      });

      this.logger.debug('Payment processing completed');
    } catch (error) {
      this.logger.error('Error processing payment:', error);
      throw error;
    }
  }
} 