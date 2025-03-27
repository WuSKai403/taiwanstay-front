import { z } from 'zod';

// 評價基本資料驗證
export const reviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  hostId: z.string(),
  opportunityId: z.string(),
  rating: z.number()
    .min(1, '評分必須至少為1顆星')
    .max(5, '評分最多為5顆星'),
  comment: z.string()
    .min(10, '評論至少需要10個字符')
    .max(1000, '評論不能超過1000個字符'),
  createdAt: z.date(),
  updatedAt: z.date()
});

// 評價創建表單驗證
export const reviewCreateSchema = reviewSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// 評價更新表單驗證
export const reviewUpdateSchema = reviewSchema
  .pick({
    rating: true,
    comment: true
  })
  .partial();

// 評價搜尋參數驗證
export const reviewSearchSchema = z.object({
  userId: z.string().optional(),
  hostId: z.string().optional(),
  opportunityId: z.string().optional(),
  minRating: z.number().min(1).max(5).optional(),
  maxRating: z.number().min(1).max(5).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sortBy: z.enum(['createdAt', 'rating']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
}).refine(
  (data) => {
    if (data.minRating && data.maxRating) {
      return data.minRating <= data.maxRating;
    }
    return true;
  },
  {
    message: '最低評分必須小於或等於最高評分',
    path: ['maxRating']
  }
);

// 評價統計參數驗證
export const reviewStatsSchema = z.object({
  hostId: z.string().optional(),
  opportunityId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional()
}).refine(
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

// 導出類型
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type ReviewCreateFormData = z.infer<typeof reviewCreateSchema>;
export type ReviewUpdateFormData = z.infer<typeof reviewUpdateSchema>;
export type ReviewSearchParams = z.infer<typeof reviewSearchSchema>;
export type ReviewStatsParams = z.infer<typeof reviewStatsSchema>;