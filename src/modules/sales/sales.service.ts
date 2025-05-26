import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SaleStatus, Prisma } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('sales') private salesQueue: Queue,
  ) {}

  async create(createSaleDto: CreateSaleDto) {
    const { loanId, agentId, shopId, customerOtp, agentOtp, depositAmount, deviceImei } = createSaleDto;

    // Verify loan exists and is approved
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    if (loan.status !== 'APPROVED') {
      throw new BadRequestException('Loan must be approved before creating a sale');
    }

    // Verify device exists and is available
    const device = await this.prisma.device.findFirst({
      where: { imei: deviceImei },
    });

    if (!device) {
      throw new NotFoundException(`Device with IMEI ${deviceImei} not found`);
    }

    if (device.status !== 'AVAILABLE') {
      throw new BadRequestException('Device is not available for sale');
    }

    // Create sale record
    const sale = await this.prisma.sale.create({
      data: {
        loanId,
        agentId,
        shopId,
        customerOtp,
        agentOtp,
        depositAmount: new Prisma.Decimal(depositAmount),
        deviceImei,
        status: SaleStatus.PENDING,
      },
    });

    // Add sale processing job to queue
    await this.salesQueue.add('process-sale', {
      saleId: sale.id,
      loanId,
      deviceId: device.id,
      customerOtp,
      agentOtp,
    });

    return sale;
  }

  async findAll() {
    return this.prisma.sale.findMany({
      include: {
        agent: true,
        shop: true,
      },
    });
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        agent: true,
        shop: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  async verifyOtp(id: string, otp: string) {
    const sale = await this.findOne(id);

    if (sale.status !== SaleStatus.PENDING) {
      throw new BadRequestException('Sale is not in pending status');
    }

    if (otp !== sale.customerOtp && otp !== sale.agentOtp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Check if both OTPs are verified
    const isCustomerOtp = otp === sale.customerOtp;
    const isAgentOtp = otp === sale.agentOtp;

    // Update OTP verification status
    await this.prisma.sale.update({
      where: { id },
      data: {
        status: isCustomerOtp && isAgentOtp ? SaleStatus.COMPLETED : SaleStatus.PENDING,
        completedAt: isCustomerOtp && isAgentOtp ? new Date() : null,
      },
    });

    if (isCustomerOtp && isAgentOtp) {
      await this.completeSale(id);
    }

    return { message: 'OTP verified successfully' };
  }

  private async completeSale(id: string) {
    const sale = await this.findOne(id);

    // Update device status
    await this.prisma.device.update({
      where: { imei: sale.deviceImei },
      data: {
        status: 'SOLD',
      },
    });

    // Update loan status
    await this.prisma.loan.update({
      where: { id: sale.loanId },
      data: {
        status: 'DISBURSED',
        disbursedAt: new Date(),
      },
    });

    // Calculate and update agent commission
    await this.updateAgentCommission(sale.agentId, sale.depositAmount);
  }

  private async updateAgentCommission(agentId: string, amount: Prisma.Decimal) {
    const agent = await this.prisma.salesAgent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Sales agent with ID ${agentId} not found`);
    }

    const commission = Prisma.Decimal.mul(amount, agent.commissionRate);

    await this.prisma.salesAgent.update({
      where: { id: agentId },
      data: {
        commissionRate: {
          increment: commission,
        },
      },
    });
  }

  async getAgentSales(agentId: string, startDate: Date, endDate: Date) {
    const sales = await this.prisma.sale.findMany({
      where: {
        agentId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        shop: true,
      },
    });

    const agent = await this.prisma.salesAgent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Sales agent with ID ${agentId} not found`);
    }

    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => 
      Prisma.Decimal.add(sum, sale.depositAmount), 
      new Prisma.Decimal(0)
    );
    const totalCommission = Prisma.Decimal.mul(totalAmount, agent.commissionRate);

    return {
      agentId,
      period: {
        startDate,
        endDate,
      },
      totalSales,
      totalAmount,
      totalCommission,
      sales,
    };
  }
} 