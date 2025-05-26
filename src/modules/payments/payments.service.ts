import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PaymentStatus, PaymentMethod, Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('payments') private paymentsQueue: Queue,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const { loanId, amount, paymentMethod, transactionRef } = createPaymentDto;

    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        user: true,
      },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    const payment = await this.prisma.payment.create({
      data: {
        loanId,
        userId: loan.userId,
        amount: new Prisma.Decimal(amount),
        paymentMethod,
        transactionRef,
        status: PaymentStatus.PENDING,
      },
    });

    // Add payment processing job to queue
    await this.paymentsQueue.add('process-payment', {
      paymentId: payment.id,
      amount,
      paymentMethod,
      transactionRef,
    });

    return payment;
  }

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        loan: true,
      },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        loan: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async processMpesaCallback(callbackData: any) {
    const { TransactionRef, ResultCode, ResultDesc, MpesaReceiptNumber } = callbackData;

    const payment = await this.prisma.payment.findFirst({
      where: { transactionRef: TransactionRef },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with transaction ref ${TransactionRef} not found`);
    }

    if (ResultCode === 0) {
      // Payment successful
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          mpesaReceiptNo: MpesaReceiptNumber,
          paidAt: new Date(),
        },
      });

      // Update loan payment status
      await this.updateLoanPaymentStatus(payment.loanId, payment.amount);
    } else {
      // Payment failed
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
        },
      });
    }

    return { message: 'Callback processed successfully' };
  }

  private async updateLoanPaymentStatus(loanId: string, amount: Prisma.Decimal) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    const updatedPrincipalPaid = Prisma.Decimal.add(loan.principalPaid, amount);
    const updatedTotalPaid = Prisma.Decimal.add(loan.totalPaid, amount);
    const outstandingAmount = Prisma.Decimal.sub(loan.amount, updatedPrincipalPaid);

    await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        principalPaid: updatedPrincipalPaid,
        totalPaid: updatedTotalPaid,
        outstandingAmount,
      },
    });
  }
} 