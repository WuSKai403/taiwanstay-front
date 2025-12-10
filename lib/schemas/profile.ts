import { z } from 'zod';

// 社交媒體驗證 (domain.SocialMedia)
export const socialMediaSchema = z.object({
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  youtube: z.string().optional(),
  tiktok: z.string().optional(),
  threads: z.string().optional(),
  line: z.string().optional(),
  website: z.string().optional(),
  other: z.array(z.object({
    name: z.string().optional(),
    url: z.string().optional(),
  })).optional()
});

// 緊急聯絡人驗證 (domain.EmergencyContact)
export const emergencyContactSchema = z.object({
  name: z.string().optional(),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

// 地理位置驗證 (domain.Location)
export const locationSchema = z.object({
  type: z.string().optional(), // "Point"
  coordinates: z.array(z.number()).optional(),
});

// 個人基本資料驗證 (domain.PersonalInfo)
export const personalInfoSchema = z.object({
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  occupation: z.string().optional(),
  education: z.string().optional(),
  currentLocation: z.string().optional(),
});

// 工作交換偏好驗證 (domain.WorkExchangePreferences)
export const workExchangePreferencesSchema = z.object({
  preferredWorkTypes: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
  minDuration: z.number().optional(),
  maxDuration: z.number().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  specialNeeds: z.string().optional(),
  hasDriverLicense: z.boolean().optional(),
  notes: z.string().optional(),
});

// 工作經驗驗證 (domain.WorkExperience)
export const workExperienceSchema = z.object({
  title: z.string().optional(),
  duration: z.string().optional(), // String in backend
  description: z.string().optional(),
});

// 個人資料驗證 (domain.Profile)
export const profileSchema = z.object({
  // Direct fields
  avatar: z.string().optional(),
  bio: z.string().max(1000).optional(),
  phoneNumber: z.string().optional(),
  isPhoneVerified: z.boolean().optional(),
  address: z.string().optional(),
  physicalCondition: z.string().optional(),
  accommodationNeeds: z.string().optional(),
  preferredWorkHours: z.number().optional(),

  // Arrays
  languages: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  culturalInterests: z.array(z.string()).optional(),
  learningGoals: z.array(z.string()).optional(),

  // Nested Objects
  location: locationSchema.optional(),
  personalInfo: personalInfoSchema.optional(),
  socialMedia: socialMediaSchema.optional(),
  emergencyContact: emergencyContactSchema.optional(),
  workExchangePreferences: workExchangePreferencesSchema.optional(),
  workExperience: z.array(workExperienceSchema).optional(),
});

// 個人資料更新表單驗證 (Partial)
export const profileUpdateSchema = profileSchema.partial();

// 導出類型 (保持部分名稱相容，或直接導出)
export type ProfileFormData = z.infer<typeof profileSchema>;
export type SocialMediaFormData = z.infer<typeof socialMediaSchema>;
export type LocationFormData = z.infer<typeof locationSchema>;
export type EmergencyContactFormData = z.infer<typeof emergencyContactSchema>;
export type WorkExchangePreferencesFormData = z.infer<typeof workExchangePreferencesSchema>;
export type WorkExperienceFormData = z.infer<typeof workExperienceSchema>;
// export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;