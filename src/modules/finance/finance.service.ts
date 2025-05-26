import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { LoanStatus, PaymentStatus } from '@prisma/client';
import { AgentPerformance } from './types/agent-performance.interface';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('finance') private financeQueue: Queue,
  ) {}

  async getFinancialSummary(startDate: Date, endDate: Date) {
    const [
      totalLoans,
      totalDisbursed,
      totalRepaid,
      totalInterest,
      defaultedLoans,
      activeLoans,
    ] = await Promise.all([
      this.getTotalLoans(startDate, endDate),
      this.getTotalDisbursed(startDate, endDate),
      this.getTotalRepaid(startDate, endDate),
      this.getTotalInterest(startDate, endDate),
      this.getDefaultedLoans(startDate, endDate),
      this.getActiveLoans(startDate, endDate),
    ]);

    return {
      period: { startDate, endDate },
      totalLoans,
      totalDisbursed,
      totalRepaid,
      totalInterest,
      defaultedLoans,
      activeLoans,
      collectionRate: (totalRepaid / totalDisbursed) * 100,
    };
  }

  private async getTotalLoans(startDate: Date, endDate: Date) {
    return this.prisma.loan.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  private async getTotalDisbursed(startDate: Date, endDate: Date) {
    const loans = await this.prisma.loan.findMany({
      where: {
        status: LoanStatus.DISBURSED,
        disbursedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return loans.reduce((sum, loan) => sum + Number(loan.amount), 0);
  }

  private async getTotalRepaid(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  }

  private async getTotalInterest(startDate: Date, endDate: Date) {
    const loans = await this.prisma.loan.findMany({
      where: {
        disbursedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return loans.reduce((sum, loan) => {
      const interest = (Number(loan.amount) * Number(loan.interestRate) * loan.tenure) / 12;
      return sum + interest;
    }, 0);
  }

  private async getDefaultedLoans(startDate: Date, endDate: Date) {
    return this.prisma.loan.count({
      where: {
        status: LoanStatus.DEFAULTED,
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  private async getActiveLoans(startDate: Date, endDate: Date) {
    return this.prisma.loan.count({
      where: {
        status: LoanStatus.ACTIVE,
        disbursedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  async generateFinancialReport(startDate: Date, endDate: Date) {
    const summary = await this.getFinancialSummary(startDate, endDate);

    // Add report generation job to queue
    await this.financeQueue.add('generate-report', {
      startDate,
      endDate,
      summary,
    });

    return summary;
  }

  async getAgentPerformanceReport(startDate: Date, endDate: Date) {
    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        agent: {
          include: {
            user: true,
          },
        },
        shop: true,
      },
    });

    const agentPerformance: Record<string, AgentPerformance> = {};
    sales.forEach(sale => {
      const agentId = sale.agent.id;
      if (!agentPerformance[agentId]) {
        agentPerformance[agentId] = {
          name: `${sale.agent.user.firstName} ${sale.agent.user.lastName}`,
          totalSales: 0,
          totalAmount: 0,
        };
      }
      agentPerformance[agentId].totalSales++;
      agentPerformance[agentId].totalAmount += Number(sale.depositAmount);
    });

    return Object.values(agentPerformance);
  }

  async getShopPerformanceReport(startDate: Date, endDate: Date) {
    const shops = await this.prisma.shop.findMany({
      include: {
        sales: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        devices: true,
      },
    });

    return shops.map(shop => ({
      shopId: shop.id,
      name: shop.name,
      location: shop.location,
      totalSales: shop.sales.length,
      totalAmount: shop.sales.reduce((sum, sale) => sum + Number(sale.depositAmount), 0),
      inventoryValue: shop.devices.reduce((sum, device) => sum + Number(device.price), 0),
    }));
  }
} 