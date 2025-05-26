import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { MailerService } from '@nestjs-modules/mailer';

type NotificationType = 'LOAN_APPROVED' | 'PAYMENT_DUE' | 'DEVICE_LOCKED' | 'SYSTEM';
type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailerService,
  ) {}

  @Process('send-notification')
  async handleNotification(job: Job) {
    const { userId, type, title, message } = job.data;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Create notification record
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: type as NotificationType,
          title,
          message,
          status: 'PENDING' as NotificationStatus,
        },
      });

      // Send email if user has an email address
      if (user.email) {
        switch (type) {
          case 'LOAN_APPROVED':
          case 'PAYMENT_DUE':
          case 'DEVICE_LOCKED':
          case 'SYSTEM':
            await this.sendEmail(user.email, title, message);
            break;
          default:
            this.logger.warn(`No email template for notification type: ${type}`);
        }
      }

      // Update notification status to sent
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT' as NotificationStatus },
      });

      this.logger.debug(`Notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('Error sending notification:', error);
      throw error;
    }
  }

  private async sendEmail(email: string, subject: string, content: string) {
    try {
      await this.mailService.sendMail({
        to: email,
        subject,
        template: 'notification',
        context: {
          subject,
          content,
        },
      });
    } catch (error) {
      this.logger.error('Error sending email:', error);
      throw error;
    }
  }
} 