import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { DeviceStatus } from '@prisma/client';

@Processor('inventory')
export class InventoryProcessor {
  private readonly logger = new Logger(InventoryProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('register-device')
  async handleDeviceRegistration(job: Job) {
    this.logger.debug('Processing device registration...');
    const { deviceId, imei } = job.data;

    try {
      // Implement device registration logic here
      // This would typically involve calling the device management API
      this.logger.debug(`Registering device ${deviceId} with IMEI ${imei}...`);

      // Update device status
      await this.prisma.device.update({
        where: { id: deviceId },
        data: {
          status: DeviceStatus.AVAILABLE,
        },
      });

      this.logger.debug('Device registration completed');
    } catch (error) {
      this.logger.error('Error registering device:', error);
      throw error;
    }
  }

  @Process('lock-device')
  async handleDeviceLock(job: Job) {
    this.logger.debug('Processing device lock...');
    const { deviceId, imei } = job.data;

    try {
      // Implement device locking logic here
      // This would typically involve calling the device management API
      this.logger.debug(`Locking device ${deviceId} with IMEI ${imei}...`);

      this.logger.debug('Device lock completed');
    } catch (error) {
      this.logger.error('Error locking device:', error);
      throw error;
    }
  }

  @Process('unlock-device')
  async handleDeviceUnlock(job: Job) {
    this.logger.debug('Processing device unlock...');
    const { deviceId, imei } = job.data;

    try {
      // Implement device unlocking logic here
      // This would typically involve calling the device management API
      this.logger.debug(`Unlocking device ${deviceId} with IMEI ${imei}...`);

      this.logger.debug('Device unlock completed');
    } catch (error) {
      this.logger.error('Error unlocking device:', error);
      throw error;
    }
  }
} 