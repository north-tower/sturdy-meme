import { Module } from '@nestjs/common';
import { DebtCollectionService } from './debt-collection.service';
import { DebtCollectionController } from './debt-collection.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DebtCollectionProcessor } from './debt-collection.processor';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'debt-collection',
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
  controllers: [DebtCollectionController],
  providers: [DebtCollectionService, PrismaService, DebtCollectionProcessor],
  exports: [DebtCollectionService],
})
export class DebtCollectionModule {} 