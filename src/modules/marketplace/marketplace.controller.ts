import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Supplier, Device } from '@prisma/client';

interface SupplierPerformanceReport {
  supplier: Supplier;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalDevices: number;
  totalValue: number;
  totalSales: number;
  totalSalesValue: number;
  devices: (Device & {
    loans: any[];
  })[];
}

@ApiTags('Marketplace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('suppliers')
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  createSupplier(@Body() createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    return this.marketplaceService.createSupplier(createSupplierDto);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Get all suppliers' })
  @ApiResponse({ status: 200, description: 'Return all suppliers' })
  findAllSuppliers(): Promise<Supplier[]> {
    return this.marketplaceService.findAllSuppliers();
  }

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiResponse({ status: 200, description: 'Return supplier by ID' })
  findOneSupplier(@Param('id') id: string): Promise<Supplier> {
    return this.marketplaceService.findOneSupplier(id);
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Update supplier' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  updateSupplier(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.marketplaceService.updateSupplier(id, updateSupplierDto);
  }

  @Post('suppliers/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate supplier' })
  @ApiResponse({ status: 200, description: 'Supplier deactivated successfully' })
  deactivateSupplier(@Param('id') id: string) {
    return this.marketplaceService.deactivateSupplier(id);
  }

  @Get('suppliers/:id/performance')
  @ApiOperation({ summary: 'Get supplier performance report' })
  @ApiResponse({ status: 200, description: 'Performance report retrieved' })
  getSupplierPerformanceReport(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<SupplierPerformanceReport> {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    return this.marketplaceService.getSupplierPerformanceReport(id, start, end);
  }
} 