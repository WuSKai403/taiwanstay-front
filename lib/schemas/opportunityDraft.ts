import { z } from 'zod';
// import { OpportunityType } from '@/models/enums';

const OpportunityTypeValues = [
  "FARMING", "GARDENING", "ANIMAL_CARE", "CONSTRUCTION", "HOSPITALITY",
  "COOKING", "CLEANING", "CHILDCARE", "ELDERLY_CARE", "TEACHING",
  "LANGUAGE_EXCHANGE", "CREATIVE", "DIGITAL_NOMAD", "ADMINISTRATION",
  "MAINTENANCE", "TOURISM", "CONSERVATION", "COMMUNITY", "EVENT", "OTHER"
] as const;

/**
 * 工作機會草稿的基本驗證架構
 * 只需要標題欄位，其他都是可選的
 */
export const opportunityDraftSchema = z.object({
  // 必填欄位 - 只要求標題
  title: z.string().min(1, { message: '標題為必填欄位' }),

  // 所有其他欄位都是可選的
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(OpportunityTypeValues).optional(),


  location: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
    coordinates: z.object({
      type: z.literal('Point'),
      coordinates: z.tuple([
        z.number().min(-180).max(180, '經度必須在 -180 到 180 之間'),
        z.number().min(-90).max(90, '緯度必須在 -90 到 90 之間')
      ])
    }).optional().or(z.null()),
    showExactLocation: z.boolean().optional(),
  }).optional(),

  workDetails: z.object({
    tasks: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    learningOpportunities: z.array(z.string()).optional(),
    physicalDemand: z.enum(['low', 'medium', 'high']).optional(),
    languages: z.array(z.string()).optional(),
    availableMonths: z.array(z.number()).optional(),
  }).optional(),

  benefits: z.object({
    accommodation: z.object({
      provided: z.boolean().optional(),
      type: z.string().optional(),
      description: z.string().optional(),
    }).optional(),
    meals: z.object({
      provided: z.boolean().optional(),
      count: z.number().optional(),
      description: z.string().optional(),
    }).optional(),
    stipend: z.object({
      provided: z.boolean().optional(),
      amount: z.number().optional(),
      currency: z.string().optional(),
      frequency: z.string().optional(),
    }).optional(),
    otherBenefits: z.array(z.string()).optional(),
  }).optional(),

  requirements: z.object({
    minAge: z.number().optional(),
    acceptsCouples: z.boolean().optional(),
    acceptsFamilies: z.boolean().optional(),
    acceptsPets: z.boolean().optional(),
    drivingLicense: z.object({
      carRequired: z.boolean().optional(),
      motorcycleRequired: z.boolean().optional(),
      otherRequired: z.boolean().optional(),
      otherDescription: z.string().optional(),
    }).optional(),
    otherRequirements: z.array(z.string()).optional(),
  }).optional(),

  media: z.object({
    images: z.array(z.object({
      url: z.string().optional(),
      alt: z.string().optional(),
    })).optional(),
    coverImage: z.object({
      url: z.string().optional(),
      alt: z.string().optional(),
    }).optional(),
    descriptions: z.record(z.string()).optional(),
  }).optional(),

  hasTimeSlots: z.boolean().optional(),

  timeSlots: z.array(z.object({
    id: z.string().optional(),
    startDate: z.string().optional(), // 改為 startDate
    endDate: z.string().optional(),   // 改為 endDate
    defaultCapacity: z.number().optional(),
    minimumStay: z.number().optional(),
    appliedCount: z.number().optional(),
    confirmedCount: z.number().optional(),
    status: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
});

export type OpportunityDraftData = z.infer<typeof opportunityDraftSchema>;

/**
 * 驗證機會草稿資料
 */
export function validateOpportunityDraft(data: any): { isValid: boolean; errors?: string[]; data?: OpportunityDraftData } {
  try {
    // 深度清理數據，移除所有 null 值的數字欄位
    const cleanedData = JSON.parse(JSON.stringify(data));

    // 清理函數 - 遞迴處理所有 null 值
    const cleanNullValues = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      Object.keys(obj).forEach(key => {
        // 處理 null 的情況
        if (obj[key] === null) {
          delete obj[key];
        }
        // 如果是物件，遞迴清理
        else if (typeof obj[key] === 'object') {
          // 處理陣列的情況
          if (Array.isArray(obj[key])) {
            obj[key].forEach((item: any) => {
              if (typeof item === 'object' && item !== null) {
                cleanNullValues(item);
              }
            });
          } else if (obj[key] !== null) {
            cleanNullValues(obj[key]);
          }
        }
      });
    };

    // 執行清理
    cleanNullValues(cleanedData);

    // 使用清理後的數據進行驗證
    const validatedData = opportunityDraftSchema.parse(cleanedData);
    return { isValid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // 收集錯誤訊息
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors };
    }
    // 其他錯誤
    return { isValid: false, errors: ['未知錯誤'] };
  }
}