import { connectToDatabase } from '@/lib/mongodb';
import EmailUsage from '../models/EmailUsage';
import { EmailOptions, EmailResponse } from '../types';

export class MailerLiteService {
  private readonly API_KEY: string;
  private readonly API_URL = 'https://connect.mailerlite.com/api/subscribers';
  private readonly DAILY_LIMIT = 1000; // MailerLite 免費版每天 1000 封

  constructor() {
    this.API_KEY = process.env.MAILERLITE_API_KEY || '';
  }

  private async getDailyUsage(): Promise<number> {
    await connectToDatabase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await EmailUsage.findOne({
      provider: 'mailerlite',
      date: today
    });

    if (!usage) {
      // 如果今天還沒有記錄，創建新記錄
      await EmailUsage.create({
        provider: 'mailerlite',
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
        provider: 'mailerlite',
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
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          email: options.to,
          fields: {
            subject: options.subject,
            html_content: options.html,
            text_content: options.text || ''
          },
          groups: ['marketing'], // 可以根據需要設置分組
          status: 'active'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 只有在發送成功後才增加使用量
      await this.incrementUsage();

      return {
        success: true,
        messageId: data.id
      };
    } catch (error) {
      console.error('MailerLite 發送郵件錯誤:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '發送郵件時發生錯誤'
      };
    }
  }
}