export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export enum EmailType {
  TRANSACTIONAL = 'transactional',    // 交易性郵件 (Brevo)
  IMPORTANT = 'important',           // 重要通知 (Brevo)
  MARKETING = 'marketing'            // 行銷郵件 (MailerLite)
}

export enum EmailProvider {
  BREVO = 'brevo',
  MAILERLITE = 'mailerlite'
}