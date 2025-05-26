import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MarketplaceProcessor } from './marketplace.processor';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'marketplace',
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
  controllers: [MarketplaceController],
  providers: [MarketplaceService, PrismaService, MarketplaceProcessor],
  exports: [MarketplaceService],
})
export class MarketplaceModule {} 