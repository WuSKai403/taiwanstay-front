// 從 models/enums 導入 UserRole
import { UserRole } from '@/models/enums/UserRole';
export { UserRole };

// 用戶類型
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId?: string;
  hostId?: string;
}

// 組織類型
export interface Organization {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  hosts: string[]; // 主人 ID 列表
  admins: string[]; // 管理員 ID 列表
  createdAt: Date;
  updatedAt: Date;
}

// 主人類型
export interface Host {
  id: string;
  userId: string;
  name: string;
  description?: string;
  image?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  organizationId?: string;
  isOrganizationAdmin?: boolean;
  opportunities: string[]; // 機會 ID 列表
  createdAt: Date;
  updatedAt: Date;
}

// 機會類型
export interface Opportunity {
  id: string;
  hostId: string;
  title: string;
  description: string;
  requirements?: string;
  benefits?: string;
  startDate?: Date;
  endDate?: Date;
  duration?: string;
  hoursPerWeek?: number;
  location: {
    address?: string;
    city?: string;
    region?: string;
    country: string;
    postalCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  categories: string[];
  skills: string[];
  images: string[];
  status: 'draft' | 'published' | 'closed';
  applicants: string[]; // 申請者 ID 列表
  createdAt: Date;
  updatedAt: Date;
}

// 申請類型
export interface Application {
  id: string;
  userId: string;
  opportunityId: string;
  hostId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: Date;
  updatedAt: Date;
}

// 評價類型
export interface Review {
  id: string;
  userId: string;
  hostId: string;
  opportunityId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

// 通知類型
export interface Notification {
  id: string;
  userId: string;
  type: 'application' | 'message' | 'review' | 'system';
  title: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

// 時段相關類型
export * from './opportunity';

export interface Profile {
  userId: string;
  bio?: string;
  location?: {
    type: string;
    coordinates: [number, number];
    address?: string;
  };
  skills?: string[];
  languages?: string[];
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}