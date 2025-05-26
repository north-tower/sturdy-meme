import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('loans')
export class LoansProcessor {
  private readonly logger = new Logger(LoansProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('calculate-schedule')
  async handleScheduleCalculation(job: Job) {
    this.logger.debug('Processing loan schedule calculation...');
    const { loanId, amount, interestRate, tenure } = job.data;

    try {
      // Calculate loan schedule
      const monthlyPayment = (amount * (interestRate / 12)) / (1 - Math.pow(1 + interestRate / 12, -tenure));
      
      // Create loan charges for each month
      const charges = [];
      let remainingPrincipal = amount;

      for (let i = 1; i <= tenure; i++) {
        const interest = remainingPrincipal * (interestRate / 12);
        const principal = monthlyPayment - interest;
        remainingPrincipal -= principal;

        charges.push({
          loanId,
          type: 'MONTHLY',
          amount: monthlyPayment,
        });
      }

      // Save charges to database
      await this.prisma.loanCharge.createMany({
        data: charges,
      });

      this.logger.debug('Loan schedule calculation completed');
    } catch (error) {
      this.logger.error('Error calculating loan schedule:', error);
      throw error;
    }
  }
} 