import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoansProcessor } from './loans.processor';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'loans',
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
  controllers: [LoansController],
  providers: [LoansService, PrismaService, LoansProcessor],
  exports: [LoansService],
})
export class LoansModule {} 