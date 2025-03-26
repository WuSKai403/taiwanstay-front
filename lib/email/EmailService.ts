import { EmailOptions, EmailResponse, EmailType, EmailProvider } from './types';
import { BrevoService } from './providers/brevo';
import { MailerLiteService } from './providers/mailerlite';

export class EmailService {
  private brevoService: BrevoService;
  private mailerLiteService: MailerLiteService;

  constructor() {
    this.brevoService = new BrevoService();
    this.mailerLiteService = new MailerLiteService();
  }

  private getProviderForType(type: EmailType): EmailProvider {
    switch (type) {
      case EmailType.TRANSACTIONAL:
        return EmailProvider.BREVO;
      case EmailType.IMPORTANT:
        return EmailProvider.BREVO;
      case EmailType.MARKETING:
        return EmailProvider.MAILERLITE;
      default:
        return EmailProvider.BREVO;
    }
  }

  async sendEmail(options: EmailOptions, type: EmailType = EmailType.TRANSACTIONAL): Promise<EmailResponse> {
    const provider = this.getProviderForType(type);

    switch (provider) {
      case EmailProvider.BREVO:
        return this.brevoService.sendEmail(options);
      case EmailProvider.MAILERLITE:
        return this.mailerLiteService.sendEmail(options);
      default:
        throw new Error('不支援的郵件服務提供商');
    }
  }
}

// 創建單例實例
const emailService = new EmailService();
export default emailService;