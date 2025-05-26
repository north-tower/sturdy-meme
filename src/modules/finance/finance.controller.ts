import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AgentPerformance } from './types/agent-performance.interface';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiResponse({ status: 200, description: 'Financial summary retrieved' })
  getFinancialSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getFinancialSummary(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('report')
  @ApiOperation({ summary: 'Generate financial report' })
  @ApiResponse({ status: 200, description: 'Financial report generated' })
  generateFinancialReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.generateFinancialReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('agent-performance')
  @ApiOperation({ summary: 'Get agent performance report' })
  @ApiResponse({ status: 200, description: 'Agent performance report retrieved' })
  getAgentPerformanceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<AgentPerformance[]> {
    return this.financeService.getAgentPerformanceReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('shop-performance')
  @ApiOperation({ summary: 'Get shop performance report' })
  @ApiResponse({ status: 200, description: 'Shop performance report retrieved' })
  getShopPerformanceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getShopPerformanceReport(
      new Date(startDate),
      new Date(endDate),
    );
  }
} 