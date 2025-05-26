import { IsDate, IsEnum } from 'class-validator';

export enum ReportType {
  LOANS = 'LOANS',
  PAYMENTS = 'PAYMENTS',
  DEVICES = 'DEVICES',
}

export class CreateReportDto {
  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsEnum(ReportType)
  type: ReportType;
} 