import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FinanceProcessor } from './finance.processor';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'finance',
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
  controllers: [FinanceController],
  providers: [FinanceService, PrismaService, FinanceProcessor],
  exports: [FinanceService],
})
export class FinanceModule {} 