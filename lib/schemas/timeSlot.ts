import { z } from 'zod';

export const capacityOverrideSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  capacity: z.number().min(1),
});

export const timeSlotSchema = z.object({
  _id: z.string(),
  startDate: z.string().min(1, '請選擇開始日期'),
  endDate: z.string().min(1, '請選擇結束日期'),
  defaultCapacity: z.number().min(1, '容量必須大於 0'),
  minimumStay: z.number().min(1, '最短停留天數必須大於 0'),
  description: z.string().optional(),
  capacityOverrides: z.array(capacityOverrideSchema).optional(),
});

export type TimeSlotFormData = z.infer<typeof timeSlotSchema>;
export type TimeSlot = z.infer<typeof timeSlotSchema>;