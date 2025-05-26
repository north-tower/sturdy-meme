import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new loan' })
  @ApiResponse({ status: 201, description: 'Loan created successfully' })
  create(@Body() createLoanDto: CreateLoanDto) {
    return this.loansService.create(createLoanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all loans' })
  @ApiResponse({ status: 200, description: 'Return all loans' })
  findAll() {
    return this.loansService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get loan by ID' })
  @ApiResponse({ status: 200, description: 'Return loan by ID' })
  findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update loan' })
  @ApiResponse({ status: 200, description: 'Loan updated successfully' })
  update(@Param('id') id: string, @Body() updateLoanDto: UpdateLoanDto) {
    return this.loansService.update(id, updateLoanDto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve loan' })
  @ApiResponse({ status: 200, description: 'Loan approved successfully' })
  approve(@Param('id') id: string) {
    return this.loansService.approve(id);
  }

  @Post(':id/disburse')
  @ApiOperation({ summary: 'Disburse loan' })
  @ApiResponse({ status: 200, description: 'Loan disbursed successfully' })
  disburse(@Param('id') id: string) {
    return this.loansService.disburse(id);
  }

  @Get(':id/early-repayment')
  @ApiOperation({ summary: 'Calculate early repayment amount' })
  @ApiResponse({ status: 200, description: 'Early repayment amount calculated' })
  calculateEarlyRepayment(@Param('id') id: string) {
    return this.loansService.calculateEarlyRepayment(id);
  }
} 