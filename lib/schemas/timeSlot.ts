import { z } from 'zod';

// domain.CapacityOverride
export const capacityOverrideSchema = z.object({
  capacity: z.number().optional(),
  endDate: z.string().optional(),
  startDate: z.string().optional(),
});

// domain.MonthlyCapacity
export const monthlyCapacitySchema = z.object({
  bookedCount: z.number().optional(),
  capacity: z.number().optional(),
  month: z.string().optional(), // YYYY-MM
});

// domain.TimeSlotStatus
export const TimeSlotStatusValues = ["OPEN", "FILLED", "CLOSED"] as const;

// domain.TimeSlot
export const timeSlotSchema = z.object({
  id: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  defaultCapacity: z.number().optional(),
  minimumStay: z.number().optional(),
  description: z.string().optional(),

  status: z.enum(TimeSlotStatusValues).optional(),
  appliedCount: z.number().optional(),
  confirmedCount: z.number().optional(),

  workDaysPerWeek: z.number().optional(),
  workHoursPerDay: z.number().optional(),

  capacityOverrides: z.array(capacityOverrideSchema).optional(),
  monthlyCapacities: z.array(monthlyCapacitySchema).optional(),
});

export type TimeSlotFormData = z.infer<typeof timeSlotSchema>; // Alias if needed
export type TimeSlot = z.infer<typeof timeSlotSchema>;
export type CapacityOverride = z.infer<typeof capacityOverrideSchema>;
export type MonthlyCapacity = z.infer<typeof monthlyCapacitySchema>;