import { z } from 'zod';
// import { OpportunityStatus } from '@/models/enums';

const OpportunityStatusValues = [
  "DRAFT", "PENDING", "ACTIVE", "PAUSED", "EXPIRED",
  "FILLED", "REJECTED", "ADMIN_PAUSED", "DELETED"
] as const;

// 狀態歷史紀錄的驗證
export const statusHistoryItemSchema = z.object({
  status: z.enum(OpportunityStatusValues),
  reason: z.string().optional(),
  changedBy: z.string().optional(),
  changedAt: z.date().default(() => new Date())
});

// 地理位置驗證
export const opportunityLocationSchema = z.object({
  address: z.string().max(200, '地址不能超過200個字符').optional(),
  city: z.string().max(50, '城市名稱不能超過50個字符').optional(),
  region: z.string().max(50, '地區名稱不能超過50個字符').optional(), // Note: Backend uses 'district', keeping region for now but be aware
  country: z.string().max(50, '國家名稱不能超過50個字符'),
  postalCode: z.string().max(10, '郵遞區號不能超過10個字符').optional(),
  coordinates: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([
      z.number().min(-180).max(180, '經度必須在 -180 到 180 之間'),
      z.number().min(-90).max(90, '緯度必須在 -90 到 90 之間')
    ])
  }).optional()
});

// 工作機會基本資料驗證
const baseOpportunitySchema = z.object({
  id: z.string(),
  hostId: z.string(),
  title: z.string().min(1, '請輸入標題').max(100, '標題不能超過100個字符'),
  description: z.string().min(1, '請輸入描述').max(2000, '描述不能超過2000個字符'),

  // Aligning with backend domain.Requirements
  requirements: z.object({
    acceptsCouples: z.boolean().optional(),
    acceptsFamilies: z.boolean().optional(),
    acceptsPets: z.boolean().optional(),
    gender: z.string().optional(), // any, male, female
    minAge: z.number().optional(),
    maxAge: z.number().optional(),
    otherRequirements: z.array(z.string()).optional(),
  }).optional(),
  // For now, if UI passes string, we might need a transform or update UI.
  // Assuming refactor implies we want the CORRECT schema.

  // Aligning with backend domain.Benefits
  benefits: z.object({
    accommodation: z.object({
      provided: z.boolean().optional(),
      type: z.string().optional(), // private_room, shared_room
      description: z.string().optional(),
    }).optional(),
    meals: z.object({
      provided: z.boolean().optional(),
      count: z.number().optional(),
      description: z.string().optional(),
    }).optional(),
    otherBenefits: z.array(z.string()).optional(),
  }).optional(),

  startDate: z.date().optional(),
  endDate: z.date().optional(),
  duration: z.string().max(100, '期間描述不能超過100個字符').optional(),
  hoursPerWeek: z.number().min(1).max(168, '每週工作時數必須在1到168之間').optional(),
  location: opportunityLocationSchema,
  categories: z.array(z.string()).min(1, '請至少選擇一個類別'),
  skills: z.array(z.string()).optional(),
  images: z.array(z.string().url('請輸入有效的圖片網址')),
  status: z.enum(OpportunityStatusValues, {
    errorMap: () => ({ message: '請選擇有效的狀態' })
  }),
  statusHistory: z.array(statusHistoryItemSchema).optional(),
  applicants: z.array(z.string()), // 申請者 ID 列表
  createdAt: z.date(),
  updatedAt: z.date()
});

export const opportunitySchema = baseOpportunitySchema.refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate < data.endDate;
    }
    return true;
  },
  {
    message: '結束日期必須晚於開始日期',
    path: ['endDate']
  }
);

// 工作機會創建表單驗證
export const opportunityCreateSchema = baseOpportunitySchema
  .omit({
    id: true,
    applicants: true,
    createdAt: true,
    updatedAt: true
  })
  .extend({
    applicants: z.array(z.string()).optional(),
    statusHistory: z.array(statusHistoryItemSchema).optional()
  });

// 工作機會更新表單驗證
export const opportunityUpdateSchema = baseOpportunitySchema
  .partial()
  .omit({
    id: true,
    hostId: true,
    createdAt: true,
    updatedAt: true
  });

// 工作機會搜尋參數驗證
export const opportunitySearchSchema = z.object({
  title: z.string().optional(),
  hostId: z.string().optional(),
  categories: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  status: z.enum(OpportunityStatusValues).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  hoursPerWeek: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sortBy: z.enum(['createdAt', 'startDate', 'hoursPerWeek']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// 導出類型
export type Opportunity = z.infer<typeof opportunitySchema>;
export type OpportunityFormData = z.infer<typeof opportunitySchema>;
export type OpportunityCreateFormData = z.infer<typeof opportunityCreateSchema>;
export type OpportunityUpdateFormData = z.infer<typeof opportunityUpdateSchema>;
export type OpportunitySearchParams = z.infer<typeof opportunitySearchSchema>;
export type OpportunityLocationFormData = z.infer<typeof opportunityLocationSchema>;
export type StatusHistoryItem = z.infer<typeof statusHistoryItemSchema>;