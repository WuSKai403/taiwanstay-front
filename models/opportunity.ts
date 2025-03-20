import { OpportunityStatus, OpportunityType } from './enums';

export interface OpportunityDetail {
  id: string;
  title: string;
  slug: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  defaultCapacity: number;
  minimumStay: number;
  appliedCount: number;
  hasTimeSlots: boolean;
  status: OpportunityStatus;
  type: OpportunityType;
  location?: {
    address?: string;
    coordinates?: {
      type: string;
      coordinates: number[];
    };
  };
  media?: {
    images: {
      url: string;
      alt?: string;
    }[];
  };
  host: {
    id: string;
    name: string;
    avatar?: string;
  };
  organization?: {
    id: string;
    name: string;
    logo?: string;
  };
}