import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ExternalApisService {
  private readonly logger = new Logger(ExternalApisService.name);
  private readonly iprsBaseUrl: string;
  private readonly mpesaBaseUrl: string;
  private readonly mpesaConsumerKey: string;
  private readonly mpesaConsumerSecret: string;
  private readonly mpesaPasskey: string;
  private readonly mpesaShortcode: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.iprsBaseUrl = this.getRequiredConfig('IPRS_BASE_URL');
    this.mpesaBaseUrl = this.getRequiredConfig('MPESA_BASE_URL');
    this.mpesaConsumerKey = this.getRequiredConfig('MPESA_CONSUMER_KEY');
    this.mpesaConsumerSecret = this.getRequiredConfig('MPESA_CONSUMER_SECRET');
    this.mpesaPasskey = this.getRequiredConfig('MPESA_PASSKEY');
    this.mpesaShortcode = this.getRequiredConfig('MPESA_SHORTCODE');
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`${key} is not configured`);
    }
    return value;
  }

  async verifyKyc(idNumber: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          this.iprsBaseUrl,
          { idNumber },
          {
            headers: {
              'Authorization': `Bearer ${this.configService.get('IPRS_API_KEY')}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error verifying KYC:', error);
      throw error;
    }
  }

  async getCreditScore(idNumber: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get('CREDIT_SCORE_API_URL')}/score`,
          {
            params: { idNumber },
            headers: {
              'Authorization': `Bearer ${this.configService.get('CREDIT_SCORE_API_KEY')}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error getting credit score:', error);
      throw error;
    }
  }

  async initiateMpesaPayment(data: {
    phoneNumber: string;
    amount: number;
    accountReference: string;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
          {
            BusinessShortCode: this.mpesaShortcode,
            Password: this.generateMpesaPassword(),
            Timestamp: this.getMpesaTimestamp(),
            TransactionType: 'CustomerPayBillOnline',
            Amount: data.amount,
            PartyA: data.phoneNumber,
            PartyB: this.mpesaShortcode,
            PhoneNumber: data.phoneNumber,
            CallBackURL: this.configService.get('MPESA_CALLBACK_URL'),
            AccountReference: data.accountReference,
            TransactionDesc: 'Payment for loan',
          },
          {
            headers: {
              'Authorization': `Bearer ${await this.getMpesaAccessToken()}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error initiating M-Pesa payment:', error);
      throw error;
    }
  }

  private async getMpesaAccessToken() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
          {
            auth: {
              username: this.mpesaConsumerKey,
              password: this.mpesaConsumerSecret,
            },
          },
        ),
      );

      return response.data.access_token;
    } catch (error) {
      this.logger.error('Error getting M-Pesa access token:', error);
      throw error;
    }
  }

  private generateMpesaPassword() {
    const timestamp = this.getMpesaTimestamp();
    const shortcode = this.mpesaShortcode;
    const passkey = this.mpesaPasskey;
    const str = shortcode + passkey + timestamp;
    return Buffer.from(str).toString('base64');
  }

  private getMpesaTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
  }
} 