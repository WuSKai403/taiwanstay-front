import { z } from 'zod';

// 主人基本資料驗證
export const hostSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1, '請輸入主人名稱').max(100, '主人名稱不能超過100個字符'),
  description: z.string().max(2000, '描述不能超過2000個字符').optional(),
  image: z.string().url('請輸入有效的圖片網址').optional(),
  email: z.string().email('請輸入有效的電子郵件').optional(),
  phone: z.string()
    .regex(/^(\+886|0)[2-9]\d{7,8}$/, '請輸入有效的台灣電話號碼')
    .optional(),
  address: z.string().max(200, '地址不能超過200個字符').optional(),
  city: z.string().max(50, '城市名稱不能超過50個字符').optional(),
  region: z.string().max(50, '地區名稱不能超過50個字符').optional(),
  country: z.string().max(50, '國家名稱不能超過50個字符').optional(),
  postalCode: z.string().max(10, '郵遞區號不能超過10個字符').optional(),
  organizationId: z.string().optional(),
  isOrganizationAdmin: z.boolean().optional(),
  opportunities: z.array(z.string()), // 機會 ID 列表
  createdAt: z.date(),
  updatedAt: z.date()
});

// 主人創建表單驗證
export const hostCreateSchema = hostSchema
  .omit({
    id: true,
    opportunities: true,
    createdAt: true,
    updatedAt: true
  })
  .extend({
    opportunities: z.array(z.string()).optional()
  });

// 主人更新表單驗證
export const hostUpdateSchema = hostSchema
  .partial()
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true
  });

// 主人搜尋參數驗證
export const hostSearchSchema = z.object({
  name: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  organizationId: z.string().optional(),
  hasActiveOpportunities: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});

// 主人設定驗證
export const hostSettingsSchema = z.object({
  autoAcceptApplications: z.boolean().optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean()
  }),
  defaultApplicationMessage: z.string().max(500, '預設訊息不能超過500個字符').optional(),
  defaultRules: z.array(z.string()).optional(),
  defaultRequirements: z.array(z.string()).optional()
});

// 導出類型
export type HostFormData = z.infer<typeof hostSchema>;
export type HostCreateFormData = z.infer<typeof hostCreateSchema>;
export type HostUpdateFormData = z.infer<typeof hostUpdateSchema>;
export type HostSearchParams = z.infer<typeof hostSearchSchema>;
export type HostSettingsFormData = z.infer<typeof hostSettingsSchema>;