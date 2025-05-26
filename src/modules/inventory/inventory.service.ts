import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DeviceStatus, LockStatus } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('inventory') private inventoryQueue: Queue,
  ) {}

  async create(createDeviceDto: CreateDeviceDto) {
    const device = await this.prisma.device.create({
      data: {
        ...createDeviceDto,
        status: DeviceStatus.AVAILABLE,
        lockStatus: LockStatus.UNLOCKED,
      },
    });

    // Add device registration job to queue
    await this.inventoryQueue.add('register-device', {
      deviceId: device.id,
      imei: device.imei,
    });

    return device;
  }

  async findAll() {
    return this.prisma.device.findMany({
      include: {
        supplier: true,
        shop: true,
      },
    });
  }

  async findOne(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        supplier: true,
        shop: true,
        loans: true,
      },
    });

    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    return device;
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto) {
    const device = await this.findOne(id);

    if (device.status === DeviceStatus.SOLD) {
      throw new BadRequestException('Cannot update a sold device');
    }

    return this.prisma.device.update({
      where: { id },
      data: updateDeviceDto,
    });
  }

  async assignToShop(deviceId: string, shopId: string) {
    const device = await this.findOne(deviceId);

    if (device.status !== DeviceStatus.AVAILABLE) {
      throw new BadRequestException('Only available devices can be assigned to shops');
    }

    return this.prisma.device.update({
      where: { id: deviceId },
      data: {
        shopId,
        status: DeviceStatus.RESERVED,
      },
    });
  }

  async lockDevice(deviceId: string) {
    const device = await this.findOne(deviceId);

    if (device.lockStatus === LockStatus.LOCKED) {
      throw new BadRequestException('Device is already locked');
    }

    // Add device locking job to queue
    await this.inventoryQueue.add('lock-device', {
      deviceId: device.id,
      imei: device.imei,
    });

    return this.prisma.device.update({
      where: { id: deviceId },
      data: {
        lockStatus: LockStatus.LOCKED,
      },
    });
  }

  async unlockDevice(deviceId: string) {
    const device = await this.findOne(deviceId);

    if (device.lockStatus === LockStatus.UNLOCKED) {
      throw new BadRequestException('Device is already unlocked');
    }

    // Add device unlocking job to queue
    await this.inventoryQueue.add('unlock-device', {
      deviceId: device.id,
      imei: device.imei,
    });

    return this.prisma.device.update({
      where: { id: deviceId },
      data: {
        lockStatus: LockStatus.UNLOCKED,
      },
    });
  }
} 