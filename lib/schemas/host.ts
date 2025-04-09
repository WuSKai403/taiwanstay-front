import { z } from 'zod';
import { cloudinaryImageResourceSchema } from './application';
import { HostType } from '@/models/enums/HostType';
import { HostStatus } from '@/models/enums/HostStatus';

// 步驟1：基本資訊驗證模型
export const hostBasicInfoSchema = z.object({
  name: z.string().min(2, "名稱至少需要2個字").max(100, "名稱不能超過100個字"),
  description: z.string().min(50, "描述至少需要50個字").max(1000, "描述不能超過1000個字"),
  type: z.nativeEnum(HostType, { errorMap: () => ({ message: "請選擇有效的主人類型" }) }),
  category: z.string().min(1, "請選擇類別"),
  foundedYear: z.number().int("請輸入有效年份").min(1900, "年份不能早於1900年").max(new Date().getFullYear(), "年份不能超過當前年份").optional().nullable(),
  teamSize: z.number().int("請輸入整數").min(1, "團隊人數至少為1").max(1000, "團隊人數不能超過1000").optional().nullable(),
  languages: z.array(z.string()).min(1, "請至少選擇一種語言"),
});

// 步驟2：位置資訊驗證模型
export const hostLocationSchema = z.object({
  country: z.string().min(1, "請選擇國家"),
  city: z.string().min(1, "請選擇城市"),
  district: z.string().min(1, "請選擇區域"),
  zipCode: z.string().optional().nullable(),
  address: z.string().min(5, "請輸入詳細地址"),
  coordinates: z.object({
    type: z.string().default("Point"),
    coordinates: z.tuple([
      z.number().min(-180).max(180), // 經度
      z.number().min(-90).max(90)    // 緯度
    ])
  }),
  showExactLocation: z.boolean().default(true),
});

// 步驟3：媒體上傳驗證模型
export const hostMediaSchema = z.object({
  photos: z.array(cloudinaryImageResourceSchema)
    .min(1, "至少需要上傳一張照片")
    .max(5, "最多只能上傳5張照片"),
  photoDescriptions: z.array(z.string().max(200, "照片描述不能超過200個字")).max(5),
  videoIntroduction: z.object({
    url: z.string().url("請輸入有效的視頻連結").optional().nullable(),
    description: z.string().max(200, "視頻描述不能超過200個字").optional().nullable(),
  }).optional().nullable(),
  additionalMedia: z.object({
    virtualTour: z.string().url("請輸入有效的虛擬導覽連結").optional().nullable().or(z.literal('')),
    presentation: cloudinaryImageResourceSchema.optional().nullable(),
  }).optional().nullable(),
});

// 步驟4：聯絡資訊驗證模型
export const hostContactInfoSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件地址"),
  phone: z.string().regex(/^(\+?886\-?|\(0\))?[0-9]{2,3}\-?[0-9]{3,4}\-?[0-9]{4}$/, "請輸入有效的台灣市話格式").optional().nullable(),
  mobile: z.string().regex(/^(\+?886|\(0\))?9\d{8}$/, "請輸入有效的台灣手機號碼格式"),
  website: z.string().url("請輸入有效的網站連結").optional().nullable(),
  socialMedia: z.object({
    facebook: z.string().url("請輸入有效的Facebook連結").optional().nullable(),
    instagram: z.string().url("請輸入有效的Instagram連結").optional().nullable(),
    threads: z.string().url("請輸入有效的Threads連結").optional().nullable(),
    line: z.string().optional().nullable(),
  }).optional().nullable(),
  preferredContactMethod: z.enum(["email", "phone", "mobile", "line"], {
    errorMap: () => ({ message: "請選擇偏好的聯絡方式" })
  }),
  contactHours: z.string().max(100, "聯絡時間描述不能超過100個字").optional(),
});

// 步驟5：主人特點與描述驗證模型
export const hostFeaturesSchema = z.object({
  features: z.array(z.string()).max(5, "最多選擇5個特色標籤"),
  story: z.string().min(50, "主人故事至少需要50個字").max(2000, "主人故事不能超過2000個字"),
  experience: z.string().max(1000, "經驗描述不能超過1000個字").optional().nullable(),
  environment: z.object({
    surroundings: z.string().min(30, "環境描述至少需要30個字").max(1000, "環境描述不能超過1000個字"),
    accessibility: z.string().max(500, "交通描述不能超過500個字").optional().nullable(),
    nearbyAttractions: z.array(z.string()).max(10, "最多添加10個附近景點").optional().nullable(),
  }),
});

// 設施與服務驗證模式 (已更新)
export const amenitiesSchema = z.object({
  basics: z.object({
    wifi: z.boolean().optional(),
    parking: z.boolean().optional(),
    elevator: z.boolean().optional(),
    airConditioner: z.boolean().optional(),
    heater: z.boolean().optional(),
    washingMachine: z.boolean().optional()
  }).optional(),
  accommodation: z.object({
    privateRoom: z.boolean().optional(),
    sharedRoom: z.boolean().optional(),
    camping: z.boolean().optional(),
    kitchen: z.boolean().optional(),
    bathroom: z.boolean().optional(),
    sharedBathroom: z.boolean().optional()
  }).optional(),
  workExchange: z.object({
    workingDesk: z.boolean().optional(),
    internetAccess: z.boolean().optional(),
    toolsProvided: z.boolean().optional(),
    trainingProvided: z.boolean().optional(),
    flexibleHours: z.boolean().optional()
  }).optional(),
  lifestyle: z.object({
    petFriendly: z.boolean().optional(),
    smokingAllowed: z.boolean().optional(),
    childFriendly: z.boolean().optional(),
    organic: z.boolean().optional(),
    vegetarian: z.boolean().optional(),
    ecoFriendly: z.boolean().optional()
  }).optional(),
  activities: z.object({
    yoga: z.boolean().optional(),
    meditation: z.boolean().optional(),
    freeDiving: z.boolean().optional(),
    scubaDiving: z.boolean().optional(),
    hiking: z.boolean().optional(),
    farmingActivities: z.boolean().optional(),
    culturalExchange: z.boolean().optional()
  }).optional(),
  customAmenities: z.array(z.string()).max(20, "最多添加20個自定義設施").optional(),
  amenitiesNotes: z.string().max(500, "設施補充說明不能超過500個字").optional().nullable(),
  workExchangeDescription: z.string().max(500, "工作交換概述不能超過500個字").optional().nullable(),
});

// 頂層通訊欄位(與後端映射)
export const emailSchema = z.string().email("請輸入有效的電子郵件地址");
export const mobileSchema = z.string().min(1, "請輸入聯絡電話");

// 完整主人註冊表單驗證模型
export const hostRegisterSchema = z.object({
  // 基本資訊
  name: z.string().min(2, "名稱至少需要2個字").max(100, "名稱不能超過100個字"),
  description: z.string().min(50, "描述至少需要50個字").max(1000, "描述不能超過1000個字"),
  type: z.nativeEnum(HostType, { errorMap: () => ({ message: "請選擇有效的主人類型" }) }),
  category: z.string().min(1, "請選擇類別"),

  // 位置資訊
  location: z.object({
    country: z.string().min(1, "請選擇國家").default("台灣"),
    city: z.string().min(1, "請選擇城市"),
    district: z.string().min(1, "請選擇區域"),
    zipCode: z.string().optional().nullable(),
    address: z.string().min(5, "請輸入詳細地址"),
    coordinates: z.object({
      type: z.string().default("Point"),
      coordinates: z.tuple([
        z.number().min(-180).max(180), // 經度
        z.number().min(-90).max(90)    // 緯度
      ])
    }).optional(),
    showExactLocation: z.boolean().default(true),
  }),

  // 媒體資訊
  media: z.object({
    gallery: z.array(cloudinaryImageResourceSchema)
      .min(1, "至少需要上傳一張照片")
      .max(5, "最多只能上傳5張照片")
      .default([]),
    videos: z.array(
      z.object({
        url: z.string().url("請輸入有效的視頻連結"),
        description: z.string().max(200, "視頻描述不能超過200個字").optional()
      })
    ).optional().default([]),
    additionalMedia: z.object({
      virtualTour: z.string().url("請輸入有效的虛擬導覽連結").optional().nullable().or(z.literal('')),
      presentation: cloudinaryImageResourceSchema.optional().nullable(),
    }).optional().nullable(),
  }).default({
    gallery: [],
    videos: [],
    additionalMedia: { virtualTour: '' }
  }),

  // 聯絡資訊
  email: z.string().email("請輸入有效的電子郵件地址"),
  mobile: z.string().min(1, "請輸入聯絡電話"),
  contactInfo: z.object({
    email: z.string().email("請輸入有效的電子郵件地址"),
    phone: z.string().regex(/^(\+?886\-?|\(0\))?[0-9]{2,3}\-?[0-9]{3,4}\-?[0-9]{4}$/, "請輸入有效的台灣市話格式").optional().nullable(),
    mobile: z.string().regex(/^(\+?886|\(0\))?9\d{8}$/, "請輸入有效的台灣手機號碼格式"),
    website: z.string().url("請輸入有效的網站連結").optional().nullable(),
    socialMedia: z.object({
      facebook: z.string().url("請輸入有效的Facebook連結").optional().nullable(),
      instagram: z.string().url("請輸入有效的Instagram連結").optional().nullable(),
      threads: z.string().url("請輸入有效的Threads連結").optional().nullable(),
      line: z.string().optional().nullable(),
    }).optional().nullable().default({}),
    preferredContactMethod: z.enum(["email", "phone", "mobile", "line"], {
      errorMap: () => ({ message: "請選擇偏好的聯絡方式" })
    }).default("email"),
    contactHours: z.string().max(100, "聯絡時間描述不能超過100個字").optional(),
  }).default({
    email: '',
    mobile: '',
    preferredContactMethod: 'email'
  }),

  // 主人特點與描述
  features: z.object({
    features: z.array(z.string()).max(5, "最多選擇5個特色標籤").default([]),
    story: z.string().min(50, "主人故事至少需要50個字").max(2000, "主人故事不能超過2000個字").optional(),
    experience: z.string().max(1000, "經驗描述不能超過1000個字").optional().nullable(),
    environment: z.object({
      surroundings: z.string().min(30, "環境描述至少需要30個字").max(1000, "環境描述不能超過1000個字").optional(),
      accessibility: z.string().max(500, "交通描述不能超過500個字").optional().nullable(),
      nearbyAttractions: z.array(z.string()).max(10, "最多添加10個附近景點").optional().nullable(),
    }).optional().nullable(),
  }).optional().default({
    features: []
  }),

  // 設施與服務
  amenities: z.object({
    basics: z.object({
      wifi: z.boolean().optional(),
      parking: z.boolean().optional(),
      elevator: z.boolean().optional(),
      airConditioner: z.boolean().optional(),
      heater: z.boolean().optional(),
      washingMachine: z.boolean().optional()
    }).optional().default({}),
    accommodation: z.object({
      privateRoom: z.boolean().optional(),
      sharedRoom: z.boolean().optional(),
      camping: z.boolean().optional(),
      kitchen: z.boolean().optional(),
      bathroom: z.boolean().optional(),
      sharedBathroom: z.boolean().optional()
    }).optional().default({}),
    workExchange: z.object({
      workingDesk: z.boolean().optional(),
      internetAccess: z.boolean().optional(),
      toolsProvided: z.boolean().optional(),
      trainingProvided: z.boolean().optional(),
      flexibleHours: z.boolean().optional()
    }).optional().default({}),
    lifestyle: z.object({
      petFriendly: z.boolean().optional(),
      smokingAllowed: z.boolean().optional(),
      childFriendly: z.boolean().optional(),
      organic: z.boolean().optional(),
      vegetarian: z.boolean().optional(),
      ecoFriendly: z.boolean().optional()
    }).optional().default({}),
    activities: z.object({
      yoga: z.boolean().optional(),
      meditation: z.boolean().optional(),
      freeDiving: z.boolean().optional(),
      scubaDiving: z.boolean().optional(),
      hiking: z.boolean().optional(),
      farmingActivities: z.boolean().optional(),
      culturalExchange: z.boolean().optional()
    }).optional().default({}),
    customAmenities: z.array(z.string()).max(20, "最多添加20個自定義設施").optional().default([]),
    amenitiesNotes: z.string().max(500, "設施補充說明不能超過500個字").optional().nullable(),
    workExchangeDescription: z.string().max(500, "工作交換概述不能超過500個字").optional().nullable(),
  }).default({}),

  // 詳細資訊
  details: z.object({
    foundedYear: z.number().int("請輸入有效年份").min(1900, "年份不能早於1900年").max(new Date().getFullYear(), "年份不能超過當前年份").optional().nullable(),
    teamSize: z.number().int("請輸入整數").min(1, "團隊人數至少為1").max(1000, "團隊人數不能超過1000").optional().nullable(),
    languages: z.array(z.string()).min(1, "請至少選擇一種語言").optional().default([]),
    rules: z.array(z.string()).optional().default([]),
    providesAccommodation: z.boolean().default(true),
    providesMeals: z.boolean().default(false)
  }).default({
    languages: [],
    rules: [],
    providesAccommodation: true,
    providesMeals: false
  }),

  // 系統欄位
  status: z.nativeEnum(HostStatus).default(HostStatus.PENDING),
  statusNote: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// 導出類型定義
export type HostBasicInfoFormData = z.infer<typeof hostBasicInfoSchema>;
export type HostLocationFormData = z.infer<typeof hostLocationSchema>;
export type HostMediaFormData = z.infer<typeof hostMediaSchema>;
export type HostContactInfoFormData = z.infer<typeof hostContactInfoSchema>;
export type HostFeaturesFormData = z.infer<typeof hostFeaturesSchema>;
export type HostAmenitiesFormData = z.infer<typeof amenitiesSchema>;
export type HostRegisterFormData = z.infer<typeof hostRegisterSchema>;

export const hostPhotoSchema = z.object({
  photos: z.array(cloudinaryImageResourceSchema)
    .min(1, '至少需要上傳一張房源照片')
    .max(5, '最多只能上傳 5 張房源照片'),
  photoDescriptions: z.array(z.string().max(100, '描述不能超過 100 字'))
    .max(5, '最多只能為 5 張照片添加描述'),
  videoIntroduction: z.string().url('請輸入有效的網址').optional(),
  additionalNotes: z.string().max(500, '備註不能超過 500 字').optional(),
});

export type HostPhotoData = z.infer<typeof hostPhotoSchema>;

export const hostSchema = z.object({
  // Basic info
  name: z.string().min(1, { message: "請輸入場所名稱" }),
  description: z.string().min(10, { message: "描述至少需要10個字符" }),
  type: z.string().min(1, { message: "請選擇場所類型" }),
  category: z.string().min(1, { message: "請選擇場所類別" }),
  foundingYear: z.number().optional(),
  teamSize: z.string().optional(),
  languages: z.array(z.string()).min(1, { message: "請至少選擇一種語言" }),

  // Location
  location: z.object({
    address: z.string().min(1, { message: "請輸入地址" }),
    city: z.string().min(1, { message: "請輸入城市" }),
    district: z.string().min(1, { message: "請輸入地區" }),
    zipCode: z.string().min(1, { message: "請輸入郵遞區號" }),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }),

  // Contact
  contact: z.object({
    phone: z.string().min(1, { message: "請輸入聯絡電話" }),
    email: z.string().email({ message: "請輸入有效的電子郵件" }),
    website: z.string().url().optional(),
    socialMedia: z.object({
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
      line: z.string().optional(),
    }).optional(),
  }),
  // 頂層通訊欄位(與後端映射)
  email: z.string().email({ message: "請輸入有效的電子郵件" }),
  mobile: z.string().min(1, { message: "請輸入聯絡電話" }),

  // Media
  photos: z.array(z.string()).min(1, { message: "請至少上傳一張照片" }),
  photoDescriptions: z.array(z.string()).optional(),
  videoIntroduction: z.object({
    url: z.string().url().optional(),
    description: z.string().optional(),
  }).optional(),

  // Amenities
  amenities: z.any().optional(),
  customAmenities: z.array(z.string()).optional(),
  amenitiesNotes: z.string().optional(),
  workExchangeDescription: z.string().optional(),

  // Features and description
  features: z.array(z.string()).optional(),
  story: z.string().min(50, { message: "故事描述至少需要50個字符" }),
  experience: z.string().optional(),
  environment: z.object({
    surroundings: z.string().min(30, { message: "環境描述至少需要30個字符" }),
    accessibility: z.string().optional(),
    nearbyAttractions: z.array(z.string()).optional(),
  }),

  // System fields
  status: z.nativeEnum(HostStatus).default(HostStatus.PENDING),
  statusNote: z.string().optional(),
});