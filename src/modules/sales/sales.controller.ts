import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales' })
  @ApiResponse({ status: 200, description: 'Return all sales' })
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale by ID' })
  @ApiResponse({ status: 200, description: 'Return sale by ID' })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post(':id/verify-otp')
  @ApiOperation({ summary: 'Verify sale OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  verifyOtp(
    @Param('id') id: string,
    @Body('otp') otp: string,
  ) {
    return this.salesService.verifyOtp(id, otp);
  }

  @Get('agent/:agentId/report')
  @ApiOperation({ summary: 'Get agent sales report' })
  @ApiResponse({ status: 200, description: 'Sales report retrieved successfully' })
  getAgentSales(
    @Param('agentId') agentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.salesService.getAgentSales(
      agentId,
      new Date(startDate),
      new Date(endDate),
    );
  }
} 