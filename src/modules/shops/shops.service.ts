import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  async create(createShopDto: CreateShopDto) {
    const { managerId, ...shopData } = createShopDto;

    // Verify manager exists and is a sales agent
    const manager = await this.prisma.salesAgent.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      throw new BadRequestException(`Sales agent with ID ${managerId} not found`);
    }

    return this.prisma.shop.create({
      data: {
        ...shopData,
        manager: {
          connect: { id: managerId },
        },
      },
      include: {
        manager: true,
      },
    });
  }

  async findAll() {
    return this.prisma.shop.findMany({
      include: {
        manager: true,
        devices: true,
        sales: true,
      },
    });
  }

  async findOne(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        manager: true,
        devices: true,
        sales: true,
      },
    });

    if (!shop) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }

    return shop;
  }

  async update(id: string, updateShopDto: UpdateShopDto) {
    const shop = await this.findOne(id);

    if (!shop.isActive) {
      throw new BadRequestException('Cannot update an inactive shop');
    }

    return this.prisma.shop.update({
      where: { id },
      data: updateShopDto,
      include: {
        manager: true,
      },
    });
  }

  async deactivate(id: string) {
    const shop = await this.findOne(id);

    if (!shop.isActive) {
      throw new BadRequestException('Shop is already inactive');
    }

    return this.prisma.shop.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  async getSalesReport(id: string, startDate: Date, endDate: Date) {
    const shop = await this.findOne(id);

    const sales = await this.prisma.sale.findMany({
      where: {
        shopId: id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        agent: true,
      },
    });

    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.depositAmount), 0);

    return {
      shop,
      period: {
        startDate,
        endDate,
      },
      totalSales,
      totalAmount,
      sales,
    };
  }
} 