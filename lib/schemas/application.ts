import { z } from 'zod';

// 定義月份選擇的 schema
export const monthSelectionSchema = z.object({
  year: z.number(),
  month: z.number(),
  isSelected: z.boolean(),
  isAvailable: z.boolean(),
  yearMonthStr: z.string().regex(/^\d{4}-\d{2}$/, '月份格式必須為 YYYY-MM')
});

// 定義同行夥伴的 schema
export const travelingWithSchema = z.object({
  partner: z.boolean(),
  children: z.boolean(),
  pets: z.boolean(),
  details: z.string()
});

// 定義時段的 schema
export const timeSlotSchema = z.object({
  id: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, '月份格式必須為 YYYY-MM'),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, '月份格式必須為 YYYY-MM'),
  defaultCapacity: z.number().min(1, '容量必須大於 0'),
  minimumStay: z.number().min(1, '最短停留天數必須大於 0'),
  appliedCount: z.number().default(0),
  confirmedCount: z.number().default(0),
  status: z.string(),
  description: z.string().optional(),
  isFull: z.boolean().default(false)
});

// 定義工作經驗的 schema
export const workExperienceSchema = z.object({
  position: z.string().min(1, '職位不能為空'),
  company: z.string().min(1, '公司名稱不能為空'),
  duration: z.string().min(1, '工作時間不能為空'),
  description: z.string().min(1, '工作描述不能為空')
});

// 定義飲食限制的 schema
export const dietaryRestrictionsSchema = z.object({
  type: z.array(z.string()),
  otherDetails: z.string(),
  vegetarianType: z.string()
});

// 定義語言能力的 schema
export const languageSchema = z.object({
  language: z.string().min(1, '語言不能為空'),
  level: z.string().min(1, '程度不能為空')
});

// 定義駕駛執照類型的 schema
export const drivingLicenseSchema = z.object({
  motorcycle: z.boolean().default(false),
  car: z.boolean().default(false),
  none: z.boolean().default(false),
  other: z.object({
    enabled: z.boolean().default(false),
    details: z.string().default('')
  })
});

// 定義適應能力評分的 schema
export const adaptabilityRatingsSchema = z.object({
  environmentAdaptation: z.number().min(1).max(5).default(3),
  teamwork: z.number().min(1).max(5).default(3),
  problemSolving: z.number().min(1).max(5).default(3),
  independentWork: z.number().min(1).max(5).default(3),
  stressManagement: z.number().min(1).max(5).default(3)
});

// 定義過往換宿經驗的 schema
export const workawayExperienceSchema = z.object({
  location: z.string(),
  period: z.string(),
  workContent: z.string(),
  experience: z.string()
});

// 定義簽名URL的schema
export const signedUrlsSchema = z.object({
  thumbnailUrl: z.string().url(),
  previewUrl: z.string().url(),
  originalUrl: z.string().url(),
  timestamp: z.number().optional(),
  expires: z.number().optional()
});

// 定義照片資源的 schema
export const ImageResourceSchema = z.object({
  publicId: z.string(),
  secureUrl: z.string().url(),
  thumbnailUrl: z.string().url(),
  previewUrl: z.string().url(),
  transformedUrl: z.string().url().optional(),
  caption: z.string().optional(),
  altText: z.string().optional(),
  displayOrder: z.number().optional(),
  version_id: z.string().optional(),
  signature: z.string().optional(),
  api_key: z.string().optional(),
  signedUrls: signedUrlsSchema.optional()
});


// ... (Previous sub-schemas remain unchanged, e.g. travelingWithSchema, workExperienceSchema, etc.)

// 定義主要申請表單的 View Schema (前端顯示用)
// 包含申請資料 + 個人資料更新
// 定義主要申請表單的 schema (Strictly matching domain.Application)
export const applicationSchema = z.object({
  id: z.string().optional(),
  opportunityId: z.string(),
  hostId: z.string(),
  userId: z.string().optional(),
  status: z.string().default("PENDING"), // Using string for now, or use enum if available
  statusNote: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),

  // Application Details
  applicationDetails: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD').optional(),
    duration: z.number().min(1).optional(),
    message: z.string().min(50, '訊息至少需要 50 個字'),
    relevantExperience: z.string().optional(),
    languages: z.array(z.string()).optional(),
    travelingWith: travelingWithSchema.optional(),
  }).optional(),

  // Review Details
  reviewDetails: z.object({
    rating: z.number().optional(),
    notes: z.string().optional(),
    reviewedAt: z.string().optional(),
    reviewedBy: z.string().optional()
  }).optional()
});

export type Application = z.infer<typeof applicationSchema>;
export type ApplicationFormData = z.infer<typeof applicationSchema>;

export const applicationStatusUpdateSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'PENDING', 'CANCELLED']),
  note: z.string().optional()
});

export type ApplicationStatusUpdate = z.infer<typeof applicationStatusUpdateSchema>;


// 導出其他類型
export type MonthSelection = z.infer<typeof monthSelectionSchema>;
export type TravelingWith = z.infer<typeof travelingWithSchema>;
export type TimeSlot = z.infer<typeof timeSlotSchema>;
export type WorkExperience = z.infer<typeof workExperienceSchema>;
export type DietaryRestrictions = z.infer<typeof dietaryRestrictionsSchema>;
export type Language = z.infer<typeof languageSchema>;
export type ImageResource = z.infer<typeof ImageResourceSchema>;
export type DrivingLicense = z.infer<typeof drivingLicenseSchema>;
export type AdaptabilityRatings = z.infer<typeof adaptabilityRatingsSchema>;
export type WorkawayExperience = z.infer<typeof workawayExperienceSchema>;