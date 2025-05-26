import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Device } from '@prisma/client';

interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  devices: Device[];
}

@Injectable()
export class MarketplaceService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('marketplace') private marketplaceQueue: Queue,
  ) {}

  async createSupplier(createSupplierDto: CreateSupplierDto) {
    const supplier = await this.prisma.supplier.create({
      data: createSupplierDto,
    });

    // Add supplier onboarding job to queue
    await this.marketplaceQueue.add('onboard-supplier', {
      supplierId: supplier.id,
      ...createSupplierDto,
    });

    return supplier;
  }

  async findAllSuppliers() {
    return this.prisma.supplier.findMany({
      include: {
        devices: true,
      },
    });
  }

  async findOneSupplier(id: string): Promise<Supplier> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        devices: true,
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier as Supplier;
  }

  async updateSupplier(id: string, updateSupplierDto: UpdateSupplierDto) {
    const supplier = await this.findOneSupplier(id);

    if (!supplier.isActive) {
      throw new BadRequestException('Cannot update an inactive supplier');
    }

    return this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto as any,
    });
  }

  async deactivateSupplier(id: string) {
    const supplier = await this.findOneSupplier(id);

    if (!supplier.isActive) {
      throw new BadRequestException('Supplier is already inactive');
    }

    return this.prisma.supplier.update({
      where: { id },
      data: { isActive: false } as any,
    });
  }

  async getSupplierPerformanceReport(id: string, startDate: Date, endDate: Date) {
    const supplier = await this.findOneSupplier(id);

    const devices = await this.prisma.device.findMany({
      where: {
        supplierId: id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        loans: true,
      },
    });

    const totalDevices = devices.length;
    const totalValue = devices.reduce((sum, device) => sum + Number(device.price), 0);
    const soldDevices = devices.filter(device => device.status === 'SOLD');
    const totalSales = soldDevices.length;
    const totalSalesValue = soldDevices.reduce((sum, device) => sum + Number(device.price), 0);

    return {
      supplier,
      period: {
        startDate,
        endDate,
      },
      totalDevices,
      totalValue,
      totalSales,
      totalSalesValue,
      devices,
    };
  }
} 