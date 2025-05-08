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
export const cloudinaryImageResourceSchema = z.object({
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

// 定義主要申請表單的 schema
export const applicationFormSchema = z.object({
  message: z.string().min(50, '訊息至少需要 50 個字').transform((val) => {
    console.log('驗證message欄位:', val, val.length >= 50);
    return val;
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, '月份格式必須為 YYYY-MM'),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, '月份格式必須為 YYYY-MM'),
  duration: z.number().min(1, '停留時間必須大於 0'),
  timeSlotId: z.string().optional(),
  availableMonths: z.array(z.string().regex(/^\d{4}-\d{2}$/, '月份格式必須為 YYYY-MM')),
  workExperience: z.array(workExperienceSchema),
  physicalCondition: z.string(),
  skills: z.string().default(''),
  preferredWorkHours: z.string().optional(),
  accommodationNeeds: z.string(),
  culturalInterests: z.array(z.string()),
  learningGoals: z.array(z.string()),
  travelingWith: travelingWithSchema.optional(),
  specialRequirements: z.string(),
  dietaryRestrictions: dietaryRestrictionsSchema,
  languages: z.array(languageSchema).min(1, '至少需要一種語言能力'),
  relevantExperience: z.string().optional(),
  motivation: z.string().min(100, '申請動機至少需要 100 個字').transform((val) => {
    console.log('驗證motivation欄位:', val, val.length >= 100);
    return val;
  }),
  photos: z.array(cloudinaryImageResourceSchema).min(1, '至少需要上傳一張照片').max(5, '最多只能上傳 5 張照片'),

  // 新增欄位
  drivingLicense: drivingLicenseSchema.default({
    motorcycle: false,
    car: false,
    none: false,
    other: {
      enabled: false,
      details: ''
    }
  }),
  allergies: z.string().default(''),
  nationality: z.string().min(1, '國籍不能為空'),
  visaType: z.string().optional(),
  preferredWorkTypes: z.string().default(''),
  unwillingWorkTypes: z.string().default(''),
  physicalStrength: z.number().min(1).max(5).default(3),
  certifications: z.string().default(''),
  workawayExperiences: z.array(workawayExperienceSchema).default([]),
  expectedSkills: z.array(z.string()).default([]),
  contribution: z.string().default(''),
  adaptabilityRatings: adaptabilityRatingsSchema.default({
    environmentAdaptation: 3,
    teamwork: 3,
    problemSolving: 3,
    independentWork: 3,
    stressManagement: 3
  }),
  photoDescriptions: z.array(z.string()).default([]),
  videoIntroduction: z.string().default(''),
  additionalNotes: z.string().default(''),
  sourceChannel: z.string().default(''),
  termsAgreed: z.boolean().refine(val => val === true, {
    message: '您必須同意條款才能繼續',
  }).transform((val) => {
    console.log('驗證termsAgreed欄位:', val);
    return val;
  })
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
export type DrivingLicense = z.infer<typeof drivingLicenseSchema>;
export type AdaptabilityRatings = z.infer<typeof adaptabilityRatingsSchema>;
export type WorkawayExperience = z.infer<typeof workawayExperienceSchema>;