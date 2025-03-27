import { connectToDatabase } from '@/lib/mongodb';
import EmailUsage from '../models/EmailUsage';
import { EmailOptions, EmailResponse } from '../types';

export class BrevoService {
  private readonly API_KEY: string;
  private readonly API_URL = 'https://api.brevo.com/v3/smtp/email';
  private readonly DAILY_LIMIT = 300; // Brevo 免費版每天 300 封
  private readonly SENDER_EMAIL: string;
  private readonly SENDER_NAME: string;

  constructor() {
    this.API_KEY = process.env.BREVO_API_KEY || '';
    this.SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@taiwanstay.com';
    this.SENDER_NAME = process.env.BREVO_SENDER_NAME || 'TaiwanStay';
  }

  private async getDailyUsage(): Promise<number> {
    await connectToDatabase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await EmailUsage.findOne({
      provider: 'brevo',
      date: today
    });

    if (!usage) {
      // 如果今天還沒有記錄，創建新記錄
      await EmailUsage.create({
        provider: 'brevo',
        date: today,
        count: 0,
        lastReset: today
      });
      return 0;
    }

    return usage.count;
  }

  private async incrementUsage(): Promise<void> {
    await connectToDatabase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await EmailUsage.findOneAndUpdate(
      {
        provider: 'brevo',
        date: today
      },
      {
        $inc: { count: 1 },
        lastReset: today
      },
      { upsert: true }
    );
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      console.log('開始發送郵件，配置:', {
        senderEmail: this.SENDER_EMAIL,
        senderName: this.SENDER_NAME,
        to: options.to,
        subject: options.subject
      });

      const currentUsage = await this.getDailyUsage();

      if (currentUsage >= this.DAILY_LIMIT) {
        return {
          success: false,
          error: '已達到每日郵件發送上限'
        };
      }

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: this.SENDER_NAME,
            email: this.SENDER_EMAIL
          },
          to: [{
            email: options.to,
            name: options.toName
          }],
          subject: options.subject,
          htmlContent: options.html,
          textContent: options.text || options.html?.replace(/<[^>]*>/g, '') || ''
        })
      });

      const responseData = await response.json();
      console.log('Brevo API 回應:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      // 只有在發送成功後才增加使用量
      await this.incrementUsage();

      return {
        success: true,
        messageId: responseData.messageId
      };
    } catch (error) {
      console.error('Brevo 發送郵件錯誤:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '發送郵件時發生錯誤'
      };
    }
  }
}