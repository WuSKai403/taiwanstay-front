import { z } from 'zod';

// 組織基本資料驗證
export const organizationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, '請輸入組織名稱').max(100, '組織名稱不能超過100個字符'),
  description: z.string().max(2000, '描述不能超過2000個字符').optional(),
  logo: z.string().url('請輸入有效的圖片網址').optional(),
  website: z.string().url('請輸入有效的網站網址').optional(),
  email: z.string().email('請輸入有效的電子郵件').optional(),
  phone: z.string()
    .regex(/^(\+886|0)[2-9]\d{7,8}$/, '請輸入有效的台灣電話號碼')
    .optional(),
  address: z.string().max(200, '地址不能超過200個字符').optional(),
  city: z.string().max(50, '城市名稱不能超過50個字符').optional(),
  region: z.string().max(50, '地區名稱不能超過50個字符').optional(),
  country: z.string().max(50, '國家名稱不能超過50個字符').optional(),
  postalCode: z.string().max(10, '郵遞區號不能超過10個字符').optional(),
  hosts: z.array(z.string()),  // 主人 ID 列表
  admins: z.array(z.string()), // 管理員 ID 列表
  createdAt: z.date(),
  updatedAt: z.date()
});

// 組織創建表單驗證
export const organizationCreateSchema = organizationSchema
  .omit({
    id: true,
    hosts: true,
    admins: true,
    createdAt: true,
    updatedAt: true
  })
  .extend({
    hosts: z.array(z.string()).optional(),
    admins: z.array(z.string()).optional()
  });

// 組織更新表單驗證
export const organizationUpdateSchema = organizationSchema
  .partial()
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true
  });

// 組織成員管理驗證
export const organizationMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['admin', 'host', 'member'], {
    errorMap: () => ({ message: '請選擇有效的成員角色' })
  })
});

// 組織搜尋參數驗證
export const organizationSearchSchema = z.object({
  name: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});

// 導出類型
export type OrganizationFormData = z.infer<typeof organizationSchema>;
export type OrganizationCreateFormData = z.infer<typeof organizationCreateSchema>;
export type OrganizationUpdateFormData = z.infer<typeof organizationUpdateSchema>;
export type OrganizationMemberFormData = z.infer<typeof organizationMemberSchema>;
export type OrganizationSearchParams = z.infer<typeof organizationSearchSchema>;