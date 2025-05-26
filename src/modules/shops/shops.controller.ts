import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Shops')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shop' })
  @ApiResponse({ status: 201, description: 'Shop created successfully' })
  create(@Body() createShopDto: CreateShopDto) {
    return this.shopsService.create(createShopDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shops' })
  @ApiResponse({ status: 200, description: 'Return all shops' })
  findAll() {
    return this.shopsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shop by ID' })
  @ApiResponse({ status: 200, description: 'Return shop by ID' })
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shop' })
  @ApiResponse({ status: 200, description: 'Shop updated successfully' })
  update(@Param('id') id: string, @Body() updateShopDto: UpdateShopDto) {
    return this.shopsService.update(id, updateShopDto);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate shop' })
  @ApiResponse({ status: 200, description: 'Shop deactivated successfully' })
  deactivate(@Param('id') id: string) {
    return this.shopsService.deactivate(id);
  }

  @Get(':id/sales-report')
  @ApiOperation({ summary: 'Get shop sales report' })
  @ApiResponse({ status: 200, description: 'Sales report retrieved successfully' })
  getSalesReport(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.shopsService.getSalesReport(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }
} 