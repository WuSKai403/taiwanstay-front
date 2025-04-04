import { TimeSlotStatus } from '@/models/enums/TimeSlotStatus';

export interface ICapacityOverride {
  startDate: string;
  endDate: string;
  capacity: number;
}

export interface IMonthlyCapacity {
  month: string; // 格式為 YYYY-MM
  capacity: number;
  bookedCount: number;
}

export interface TimeSlot {
  _id: string;
  startDate: string;
  endDate: string;
  startMonth: string; // 格式為 YYYY-MM
  endMonth: string; // 格式為 YYYY-MM
  defaultCapacity: number;
  minimumStay: number;
  appliedCount: number;
  confirmedCount: number;
  status: TimeSlotStatus;
  description?: string;
  capacityOverrides?: ICapacityOverride[];
  monthlyCapacities?: IMonthlyCapacity[];
}