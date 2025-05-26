import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('loans') private loansQueue: Queue,
  ) {}

  async create(createLoanDto: CreateLoanDto) {
    const { userId, deviceId, amount, interestRate, tenure } = createLoanDto;

    // Calculate loan details
    const interest = (amount * interestRate * tenure) / 12;
    const totalAmount = amount + interest;
    const monthlyPayment = totalAmount / tenure;

    const loan = await this.prisma.loan.create({
      data: {
        userId,
        deviceId,
        amount,
        interestRate,
        tenure,
        outstandingAmount: totalAmount,
        status: LoanStatus.PENDING,
      },
    });

    // Add loan calculation job to queue
    await this.loansQueue.add('calculate-schedule', {
      loanId: loan.id,
      amount,
      interestRate,
      tenure,
    });

    return loan;
  }

  async findAll() {
    return this.prisma.loan.findMany({
      include: {
        user: true,
        device: true,
        payments: true,
      },
    });
  }

  async findOne(id: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        user: true,
        device: true,
        payments: true,
        loanCharges: true,
        extensions: true,
      },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${id} not found`);
    }

    return loan;
  }

  async update(id: string, updateLoanDto: UpdateLoanDto) {
    const loan = await this.findOne(id);

    if (loan.status === LoanStatus.COMPLETED) {
      throw new BadRequestException('Cannot update a completed loan');
    }

    return this.prisma.loan.update({
      where: { id },
      data: updateLoanDto,
    });
  }

  async approve(id: string) {
    const loan = await this.findOne(id);

    if (loan.status !== LoanStatus.PENDING) {
      throw new BadRequestException('Only pending loans can be approved');
    }

    return this.prisma.loan.update({
      where: { id },
      data: {
        status: LoanStatus.APPROVED,
        approvedAt: new Date(),
      },
    });
  }

  async disburse(id: string) {
    const loan = await this.findOne(id);

    if (loan.status !== LoanStatus.APPROVED) {
      throw new BadRequestException('Only approved loans can be disbursed');
    }

    return this.prisma.loan.update({
      where: { id },
      data: {
        status: LoanStatus.DISBURSED,
        disbursedAt: new Date(),
      },
    });
  }

  async calculateEarlyRepayment(id: string) {
    const loan = await this.findOne(id);
    const today = new Date();
    const disbursementDate = loan.disbursedAt;
    
    if (!disbursementDate) {
      throw new BadRequestException('Loan has not been disbursed');
    }

    const monthsElapsed = (today.getFullYear() - disbursementDate.getFullYear()) * 12 +
      (today.getMonth() - disbursementDate.getMonth());

    const remainingMonths = loan.tenure - monthsElapsed;
    const remainingPrincipal = loan.amount.toNumber() - loan.principalPaid.toNumber();
    const remainingInterest = (remainingPrincipal * loan.interestRate.toNumber() * remainingMonths) / 12;

    return {
      remainingPrincipal,
      remainingInterest,
      totalAmount: remainingPrincipal + remainingInterest,
    };
  }
} 