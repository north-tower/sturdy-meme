import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InventoryProcessor } from './inventory.processor';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'inventory',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [InventoryController],
  providers: [InventoryService, PrismaService, InventoryProcessor],
  exports: [InventoryService],
})
export class InventoryModule {} 