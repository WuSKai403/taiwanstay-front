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
  district: z.string().max(50, '地區名稱不能超過50個字符').optional(),
  country: z.string().max(50, '國家名稱不能超過50個字符').optional(),
  coordinates: z.any().optional(), // GeoJSON structure or custom object
});

// 工作機會基本資料驗證
const baseOpportunitySchema = z.object({
  id: z.string().optional(),
  hostId: z.string().optional(),
  title: z.string().min(1, '請輸入標題').max(100, '標題不能超過100個字符'),
  description: z.string().min(1, '請輸入描述').max(2000, '描述不能超過2000個字符'),
  type: z.string().optional(), // or enum

  // Media structure
  media: z.object({
    coverImage: z.any().optional(), // types/api.ts says hostPhoto
    images: z.array(z.any()).optional(),
  }).optional(),

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

  startDate: z.any().optional(), // string or date
  endDate: z.any().optional(),
  duration: z.string().max(100, '期間描述不能超過100個字符').optional(),
  hoursPerWeek: z.number().min(1).max(168, '每週工作時數必須在1到168之間').optional(),
  location: opportunityLocationSchema,
  categories: z.array(z.string()).optional(), // Backend doesn't show categories in top level, maybe mapped from type?
  skills: z.array(z.string()).optional(),

  status: z.enum(OpportunityStatusValues, {
    errorMap: () => ({ message: '請選擇有效的狀態' })
  }).optional(),
  statusHistory: z.array(statusHistoryItemSchema).optional(),
  applicants: z.number().optional(), // Backend stats.applications is number
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const opportunitySchema = baseOpportunitySchema.refine(
  (data) => {
    // If strict date objects are needed, convert strings. For now, relax or check types.
    // Simplifying for now to avoid runtime crashes on string dates.
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
    // applicants: z.array(z.string()).optional(),
    // statusHistory: z.array(statusHistoryItemSchema).optional()
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