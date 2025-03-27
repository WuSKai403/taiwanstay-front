import { z } from 'zod';

// 社交媒體驗證
export const socialMediaSchema = z.object({
  instagram: z.string().url('請輸入有效的 Instagram 網址').optional(),
  facebook: z.string().url('請輸入有效的 Facebook 網址').optional(),
  twitter: z.string().url('請輸入有效的 Twitter 網址').optional(),
  linkedin: z.string().url('請輸入有效的 LinkedIn 網址').optional(),
  website: z.string().url('請輸入有效的網站網址').optional()
});

// 地理位置驗證
export const locationSchema = z.object({
  type: z.string().default('Point'),
  coordinates: z.tuple([
    z.number().min(-180).max(180, '經度必須在 -180 到 180 之間'),
    z.number().min(-90).max(90, '緯度必須在 -90 到 90 之間')
  ]),
  address: z.string().optional()
});

// 個人資料驗證
export const profileSchema = z.object({
  userId: z.string(),
  bio: z.string().max(1000, '簡介不能超過1000個字符').optional(),
  location: locationSchema.optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(
    z.string().refine((val) => /^[A-Z]{2}$/.test(val), {
      message: '語言代碼必須是兩個大寫字母（如：EN、ZH）'
    })
  ).optional(),
  socialMedia: socialMediaSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// 個人資料更新表單驗證
export const profileUpdateSchema = profileSchema.partial().omit({
  userId: true,
  createdAt: true,
  updatedAt: true
});

// 技能更新驗證
export const skillsUpdateSchema = z.object({
  skills: z.array(z.string())
});

// 語言更新驗證
export const languagesUpdateSchema = z.object({
  languages: z.array(
    z.string().refine((val) => /^[A-Z]{2}$/.test(val), {
      message: '語言代碼必須是兩個大寫字母（如：EN、ZH）'
    })
  )
});

// 導出類型
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type SkillsUpdateFormData = z.infer<typeof skillsUpdateSchema>;
export type LanguagesUpdateFormData = z.infer<typeof languagesUpdateSchema>;
export type SocialMediaFormData = z.infer<typeof socialMediaSchema>;
export type LocationFormData = z.infer<typeof locationSchema>;