import { Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { DebtCollectionService } from './debt-collection.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Debt Collection')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('debt-collection')
export class DebtCollectionController {
  constructor(private readonly debtCollectionService: DebtCollectionService) {}

  @Get('defaulted-loans')
  @ApiOperation({ summary: 'Get all defaulted loans' })
  @ApiResponse({ status: 200, description: 'Return all defaulted loans' })
  findDefaultedLoans() {
    return this.debtCollectionService.findDefaultedLoans();
  }

  @Post(':loanId/initiate')
  @ApiOperation({ summary: 'Initiate collection process for a loan' })
  @ApiResponse({ status: 200, description: 'Collection process initiated' })
  initiateCollection(@Param('loanId') loanId: string) {
    return this.debtCollectionService.initiateCollection(loanId);
  }

  @Post(':loanId/lock-device')
  @ApiOperation({ summary: 'Lock device for defaulted loan' })
  @ApiResponse({ status: 200, description: 'Device locking process initiated' })
  lockDefaultedDevice(@Param('loanId') loanId: string) {
    return this.debtCollectionService.lockDefaultedDevice(loanId);
  }

  @Get('report')
  @ApiOperation({ summary: 'Get collection report' })
  @ApiResponse({ status: 200, description: 'Collection report retrieved' })
  getCollectionReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.debtCollectionService.getCollectionReport(
      new Date(startDate),
      new Date(endDate),
    );
  }
} 