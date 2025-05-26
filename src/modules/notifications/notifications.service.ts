import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NotificationType, NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        ...data,
        status: NotificationStatus.PENDING,
      },
    });

    // Add notification processing job to queue
    await this.notificationsQueue.add('process-notification', {
      notificationId: notification.id,
      ...data,
    });

    return notification;
  }

  async sendLoanApprovalNotification(loanId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: true },
    });

    if (!loan) {
      throw new Error('Loan not found');
    }

    return this.createNotification({
      userId: loan.userId,
      type: NotificationType.LOAN_APPROVED,
      title: 'Loan Approved',
      message: `Your loan of ${loan.amount} has been approved.`,
      data: {
        loanId,
        amount: loan.amount,
        tenure: loan.tenure,
      },
    });
  }

  async sendPaymentReminder(loanId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: true },
    });

    if (!loan) {
      throw new Error('Loan not found');
    }

    return this.createNotification({
      userId: loan.userId,
      type: NotificationType.PAYMENT_DUE,
      title: 'Payment Reminder',
      message: `Your payment of ${loan.outstandingAmount} is due soon.`,
      data: {
        loanId,
        amount: loan.outstandingAmount,
        dueDate: loan.dueDate,
      },
    });
  }

  async sendDeviceLockedNotification(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        loans: {
          include: { user: true },
        },
      },
    });

    if (!device) {
      throw new Error('Device not found');
    }

    const loan = device.loans[0];
    if (!loan) {
      throw new Error('No loan found for device');
    }

    return this.createNotification({
      userId: loan.userId,
      type: NotificationType.DEVICE_LOCKED,
      title: 'Device Locked',
      message: 'Your device has been locked due to missed payments.',
      data: {
        deviceId,
        loanId: loan.id,
      },
    });
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        status: NotificationStatus.PENDING,
      },
      data: {
        status: NotificationStatus.READ,
      },
    });
  }
}