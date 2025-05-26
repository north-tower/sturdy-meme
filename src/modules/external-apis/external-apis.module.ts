import { Module } from '@nestjs/common';
import { ExternalApisService } from './external-apis.service';
import { ExternalApisController } from './external-apis.controller';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
  ],
  controllers: [ExternalApisController],
  providers: [ExternalApisService],
  exports: [ExternalApisService],
})
export class ExternalApisModule {} 