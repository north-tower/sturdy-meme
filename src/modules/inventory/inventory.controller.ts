import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new device' })
  @ApiResponse({ status: 201, description: 'Device created successfully' })
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.inventoryService.create(createDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices' })
  @ApiResponse({ status: 200, description: 'Return all devices' })
  findAll() {
    return this.inventoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  @ApiResponse({ status: 200, description: 'Return device by ID' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update device' })
  @ApiResponse({ status: 200, description: 'Device updated successfully' })
  update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.inventoryService.update(id, updateDeviceDto);
  }

  @Post(':id/assign-shop')
  @ApiOperation({ summary: 'Assign device to shop' })
  @ApiResponse({ status: 200, description: 'Device assigned to shop successfully' })
  assignToShop(
    @Param('id') id: string,
    @Body('shopId') shopId: string,
  ) {
    return this.inventoryService.assignToShop(id, shopId);
  }

  @Post(':id/lock')
  @ApiOperation({ summary: 'Lock device' })
  @ApiResponse({ status: 200, description: 'Device locked successfully' })
  lockDevice(@Param('id') id: string) {
    return this.inventoryService.lockDevice(id);
  }

  @Post(':id/unlock')
  @ApiOperation({ summary: 'Unlock device' })
  @ApiResponse({ status: 200, description: 'Device unlocked successfully' })
  unlockDevice(@Param('id') id: string) {
    return this.inventoryService.unlockDevice(id);
  }
} 