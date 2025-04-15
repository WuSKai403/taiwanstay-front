import { UserRole } from '@/models/enums/UserRole';

// 基本個人資料介面（所有角色必填）
interface BaseProfile {
  // 必填欄位
  avatar: string;
  birthDate: Date;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

// 一般使用者的個人資料介面
interface UserProfile extends BaseProfile {
  // 必填欄位
  preferredWorkHours: number;
  physicalCondition: string;
  languages: string[];

  // 選填欄位
  dietaryRestrictions?: string[];
  skills?: string[];
  interests?: string[];
  experience?: {
    workExperience?: string;
    volunteerExperience?: string;
    relevantCertifications?: string[];
  };
  preferences?: {
    preferredLocations?: string[];
    preferredDuration?: {
      min: number;
      max: number;
    };
    preferredWorkTypes?: string[];
    accommodationPreferences?: string[];
    dietaryPreferences?: string[];
  };
}

// 主辦方管理員的個人資料介面
interface HostProfile extends BaseProfile {
  // 必填欄位
  position: string;
  department: string;
  responsibilities: string[];

  // 選填欄位
  contactPreferences?: {
    availableTime?: string;
    responseTime?: string;
  };
}

// 系統管理員的個人資料介面
interface AdminProfile extends BaseProfile {
  // 必填欄位
  adminLevel: string;
  permissions: string[];

  // 選填欄位
  lastLogin?: Date;
  securityClearance?: string;
}

// 使用者資料介面
export interface User {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  image: string;
  profile: UserProfile | HostProfile | AdminProfile;
  hostId?: string;
  organizationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 匯出類型
export type { BaseProfile, UserProfile, HostProfile, AdminProfile };