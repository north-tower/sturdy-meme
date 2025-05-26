import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SalesProcessor } from './sales.processor';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'sales',
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
  controllers: [SalesController],
  providers: [SalesService, PrismaService, SalesProcessor],
  exports: [SalesService],
})
export class SalesModule {} 