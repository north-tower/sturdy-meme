import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Post('users/:userId/role')
  @ApiOperation({ summary: 'Manage user role' })
  @ApiResponse({ status: 200, description: 'User role updated' })
  manageUserRole(
    @Param('userId') userId: string,
    @Body('role') role: UserRole,
  ) {
    return this.adminService.manageUserRole(userId, role);
  }

  @Get('reports/system')
  @ApiOperation({ summary: 'Generate system report' })
  @ApiResponse({ status: 200, description: 'System report generated' })
  generateSystemReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.adminService.generateSystemReport(
      new Date(startDate),
      new Date(endDate),
    );
  }
} 