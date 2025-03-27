import { z } from 'zod';

// 定義月份選擇的 schema
export const monthSelectionSchema = z.object({
  year: z.number(),
  month: z.number(),
  isSelected: z.boolean(),
  isAvailable: z.boolean()
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
  startDate: z.string(),
  endDate: z.string(),
  isFull: z.boolean()
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

// 定義照片資源的 schema
export const cloudinaryImageResourceSchema = z.object({
  public_id: z.string(),
  secure_url: z.string().url(),
  thumbnailUrl: z.string().url(),
  previewUrl: z.string().url(),
  transformedUrl: z.string().url().optional(),
  caption: z.string().optional(),
  altText: z.string().optional(),
  displayOrder: z.number().optional(),
  version_id: z.string().optional(),
  signature: z.string().optional(),
  api_key: z.string().optional()
});

// 定義主要申請表單的 schema
export const applicationFormSchema = z.object({
  message: z.string().min(50, '訊息至少需要 50 個字'),
  startDate: z.string().min(1, '開始日期不能為空'),
  endDate: z.string().optional(),
  duration: z.number().min(1, '停留時間至少需要 1 天'),
  timeSlotId: z.string().optional(),
  workExperience: z.array(workExperienceSchema),
  physicalCondition: z.string().min(1, '身體狀況不能為空'),
  skills: z.array(z.string()),
  preferredWorkHours: z.string().min(1, '偏好工作時間不能為空'),
  accommodationNeeds: z.string().min(1, '住宿需求不能為空'),
  culturalInterests: z.array(z.string()),
  learningGoals: z.array(z.string()),
  travelingWith: travelingWithSchema,
  specialRequirements: z.string(),
  dietaryRestrictions: dietaryRestrictionsSchema,
  languages: z.array(languageSchema).min(1, '至少需要一種語言能力'),
  relevantExperience: z.string().optional(),
  motivation: z.string().optional(),
  photos: z.array(cloudinaryImageResourceSchema).min(1, '至少需要上傳一張照片').max(5, '最多只能上傳 5 張照片')
});

// 導出類型
export type ApplicationFormData = z.infer<typeof applicationFormSchema>;
export type MonthSelection = z.infer<typeof monthSelectionSchema>;
export type TravelingWith = z.infer<typeof travelingWithSchema>;
export type TimeSlot = z.infer<typeof timeSlotSchema>;
export type WorkExperience = z.infer<typeof workExperienceSchema>;
export type DietaryRestrictions = z.infer<typeof dietaryRestrictionsSchema>;
export type Language = z.infer<typeof languageSchema>;
export type CloudinaryImageResource = z.infer<typeof cloudinaryImageResourceSchema>;