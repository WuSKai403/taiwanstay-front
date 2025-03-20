import { TimeSlotStatus } from '@/models/enums/TimeSlotStatus';

export interface ICapacityOverride {
  startDate: string;
  endDate: string;
  capacity: number;
}

export interface TimeSlot {
  _id: string;
  startDate: string;
  endDate: string;
  defaultCapacity: number;
  minimumStay: number;
  appliedCount: number;
  confirmedCount: number;
  status: TimeSlotStatus;
  description?: string;
  capacityOverrides?: ICapacityOverride[];
}