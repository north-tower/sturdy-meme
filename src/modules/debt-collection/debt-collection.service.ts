import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class DebtCollectionService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('debt-collection') private debtCollectionQueue: Queue,
  ) {}

  async findDefaultedLoans() {
    const today = new Date();
    
    return this.prisma.loan.findMany({
      where: {
        status: LoanStatus.ACTIVE,
        dueDate: {
          lt: today,
        },
      },
      include: {
        user: true,
        device: true,
      },
    });
  }

  async initiateCollection(loanId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        user: true,
        device: true,
      },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    // Add collection job to queue
    await this.debtCollectionQueue.add('initiate-collection', {
      loanId,
      userId: loan.userId,
      deviceId: loan.deviceId,
      amount: loan.outstandingAmount,
    });

    // Update loan status
    await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.DEFAULTED,
      },
    });

    return { message: 'Collection process initiated' };
  }

  async lockDefaultedDevice(loanId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        device: true,
      },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    if (!loan.device) {
      throw new NotFoundException('No device associated with this loan');
    }

    // Add device locking job to queue
    await this.debtCollectionQueue.add('lock-device', {
      deviceId: loan.device.id,
      imei: loan.device.imei,
    });

    return { message: 'Device locking process initiated' };
  }

  async getCollectionReport(startDate: Date, endDate: Date) {
    const defaultedLoans = await this.prisma.loan.findMany({
      where: {
        status: LoanStatus.DEFAULTED,
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: true,
        device: true,
      },
    });

    const totalDefaultedLoans = defaultedLoans.length;
    const totalDefaultedAmount = defaultedLoans.reduce(
      (sum, loan) => sum + Number(loan.outstandingAmount),
      0,
    );

    return {
      period: {
        startDate,
        endDate,
      },
      totalDefaultedLoans,
      totalDefaultedAmount,
      defaultedLoans,
    };
  }
} 