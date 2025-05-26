import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { LoanStatus, PaymentStatus } from '@prisma/client';
import { CreateReportDto, ReportType } from './dto/create-report.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('admin') private adminQueue: Queue,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalLoans,
      totalPayments,
      totalDevices,
      activeLoans,
      defaultedLoans,
      totalSales,
      totalRevenue,
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getTotalLoans(),
      this.getTotalPayments(),
      this.getTotalDevices(),
      this.getActiveLoans(),
      this.getDefaultedLoans(),
      this.getTotalSales(),
      this.getTotalRevenue(),
    ]);

    return {
      totalUsers,
      totalLoans,
      totalPayments,
      totalDevices,
      activeLoans,
      defaultedLoans,
      totalSales,
      totalRevenue,
      collectionRate: (totalPayments / totalLoans) * 100,
    };
  }

  private async getTotalUsers() {
    return this.prisma.user.count();
  }

  private async getTotalLoans() {
    return this.prisma.loan.count();
  }

  private async getTotalPayments() {
    return this.prisma.payment.count({
      where: {
        status: PaymentStatus.COMPLETED,
      },
    });
  }

  private async getTotalDevices() {
    return this.prisma.device.count();
  }

  private async getActiveLoans() {
    return this.prisma.loan.count({
      where: {
        status: LoanStatus.ACTIVE,
      },
    });
  }

  private async getDefaultedLoans() {
    return this.prisma.loan.count({
      where: {
        status: LoanStatus.DEFAULTED,
      },
    });
  }

  private async getTotalSales() {
    return this.prisma.sale.count({
      where: {
        status: 'COMPLETED',
      },
    });
  }

  private async getTotalRevenue() {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
      },
    });

    return payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  }

  async manageUserRole(userId: string, role: 'ADMIN' | 'USER' | 'AGENT' | 'MANAGER') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: ({ role } as any),
    });
  }

  async generateSystemReport(startDate: Date, endDate: Date) {
    const stats = await this.getDashboardStats();
    const loanStats = await this.getLoanStats(startDate, endDate);
    const paymentStats = await this.getPaymentStats(startDate, endDate);
    const salesStats = await this.getSalesStats(startDate, endDate);

    // Add report generation job to queue
    await this.adminQueue.add('generate-system-report', {
      startDate,
      endDate,
      stats,
      loanStats,
      paymentStats,
      salesStats,
    });

    return {
      period: { startDate, endDate },
      stats,
      loanStats,
      paymentStats,
      salesStats,
    };
  }

  private async getLoanStats(startDate: Date, endDate: Date) {
    const loans = await this.prisma.loan.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      totalLoans: loans.length,
      totalAmount: loans.reduce((sum, loan) => sum + Number(loan.amount), 0),
      averageAmount: loans.length > 0
        ? loans.reduce((sum, loan) => sum + Number(loan.amount), 0) / loans.length
        : 0,
      statusDistribution: this.getStatusDistribution(loans),
    };
  }

  private async getPaymentStats(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
      averageAmount: payments.length > 0
        ? payments.reduce((sum, payment) => sum + Number(payment.amount), 0) / payments.length
        : 0,
      methodDistribution: this.getPaymentMethodDistribution(payments),
    };
  }

  private async getSalesStats(startDate: Date, endDate: Date) {
    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        agent: true,
        shop: true,
      },
    });

    return {
      totalSales: sales.length,
      totalAmount: sales.reduce((sum, sale) => sum + Number(sale.depositAmount), 0),
      averageAmount: sales.length > 0
        ? sales.reduce((sum, sale) => sum + Number(sale.depositAmount), 0) / sales.length
        : 0,
      agentPerformance: this.getAgentPerformance(sales),
      shopPerformance: this.getShopPerformance(sales),
    };
  }

  private getStatusDistribution(loans: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    loans.forEach(loan => {
      distribution[loan.status] = (distribution[loan.status] || 0) + 1;
    });
    return distribution;
  }

  private getPaymentMethodDistribution(payments: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    payments.forEach(payment => {
      distribution[payment.paymentMethod] = (distribution[payment.paymentMethod] || 0) + 1;
    });
    return distribution;
  }

  private getAgentPerformance(sales: any[]): Record<string, { name: string; totalSales: number; totalAmount: number }> {
    const performance: Record<string, { name: string; totalSales: number; totalAmount: number }> = {};
    sales.forEach(sale => {
      const agentId = sale.agent.id;
      if (!performance[agentId]) {
        performance[agentId] = {
          name: `${sale.agent.user.firstName} ${sale.agent.user.lastName}`,
          totalSales: 0,
          totalAmount: 0,
        };
      }
      performance[agentId].totalSales++;
      performance[agentId].totalAmount += Number(sale.depositAmount);
    });
    return performance;
  }

  private getShopPerformance(sales: any[]): Record<string, { name: string; totalSales: number; totalAmount: number }> {
    const performance: Record<string, { name: string; totalSales: number; totalAmount: number }> = {};
    sales.forEach(sale => {
      const shopId = sale.shop.id;
      if (!performance[shopId]) {
        performance[shopId] = {
          name: sale.shop.name,
          totalSales: 0,
          totalAmount: 0,
        };
      }
      performance[shopId].totalSales++;
      performance[shopId].totalAmount += Number(sale.depositAmount);
    });
    return performance;
  }

  async findAllUsers() {
    return this.prisma.user.findMany({
      include: {
        loans: true,
        payments: true,
      } as any,
    });
  }

  async findOneUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        loans: true,
        payments: true,
      } as any,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async updateUserRole(id: string, role: 'ADMIN' | 'USER' | 'AGENT' | 'MANAGER') {
    const user = await this.prisma.user.update({
      where: { id },
      data: ({ role } as any),
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async generateReport(dto: CreateReportDto) {
    const { startDate, endDate, type } = dto;

    switch (type) {
      case ReportType.LOANS:
        return this.prisma.loan.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            user: true,
            device: true,
            payments: true,
          },
        });

      case ReportType.PAYMENTS:
        return this.prisma.payment.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            user: true,
            loan: true,
          },
        });

      case ReportType.DEVICES:
        return this.prisma.device.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            loans: true,
            shop: true,
            supplier: true,
          },
        });

      default:
        throw new Error(`Invalid report type: ${type}`);
    }
  }
} 