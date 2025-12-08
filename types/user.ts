import { PrivacyLevel } from '../models/enums/PrivacyLevel';
import { UserRole } from '../models/enums/UserRole';

export interface IUser {
    _id?: string;
    name: string;
    email: string;
    image?: string;
    emailVerified?: Date | string;
    password?: string;
    role: UserRole;
    profile: {
        avatar?: string;
        bio?: string;
        skills?: string[];
        languages?: string[];
        location?: {
            type: string;
            coordinates: number[];
        };
        // 社交媒體帳號
        socialMedia?: {
            instagram?: string;
            facebook?: string;
            threads?: string;
            linkedin?: string;
            twitter?: string;
            youtube?: string;
            tiktok?: string;
            website?: string;
            other?: {
                name: string;
                url: string;
            }[];
        };
        // 個人資訊
        personalInfo?: {
            birthdate?: Date | string;
            gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
            nationality?: string;
            currentLocation?: string;
            occupation?: string;
            education?: string;
        };
        // 工作換宿偏好
        workExchangePreferences?: {
            preferredWorkTypes?: string[];
            preferredLocations?: string[];
            availableFrom?: Date | string;
            availableTo?: Date | string;
            minDuration?: number; // 最短可停留天數
            maxDuration?: number; // 最長可停留天數
            hasDriverLicense?: boolean;
            dietaryRestrictions?: string[];
            specialNeeds?: string;
            notes?: string;
        };
        // 基本個人資訊
        birthDate: Date | string;
        emergencyContact: {
            name: string;
            relationship: string;
            phone: string;
            email?: string;
        };
        // 工作能力相關
        workExperience: Array<{
            title: string;
            description: string;
            duration: string;
        }>;
        physicalCondition: string;
        accommodationNeeds: string;
        culturalInterests: string[];
        learningGoals: string[];
        // 基本安全驗證
        phoneNumber?: string;
        isPhoneVerified: boolean;
        // 其他基本資訊
        preferredWorkHours: number;
    };
    hostId?: string;
    organizationId?: string;

    // 隱私設置
    privacySettings: {
        // 基本資訊隱私設置
        email: PrivacyLevel;
        phone: PrivacyLevel;

        // 個人資訊隱私設置
        personalInfo: {
            birthdate: PrivacyLevel;
            gender: PrivacyLevel;
            nationality: PrivacyLevel;
            currentLocation: PrivacyLevel;
            occupation: PrivacyLevel;
            education: PrivacyLevel;
        };

        // 社交媒體隱私設置
        socialMedia: {
            instagram: PrivacyLevel;
            facebook: PrivacyLevel;
            threads: PrivacyLevel;
            linkedin: PrivacyLevel;
            twitter: PrivacyLevel;
            youtube: PrivacyLevel;
            tiktok: PrivacyLevel;
            website: PrivacyLevel;
            other: PrivacyLevel;
        };

        // 工作換宿偏好隱私設置
        workExchangePreferences: PrivacyLevel;

        // 其他設置
        skills: PrivacyLevel;
        languages: PrivacyLevel;
        bio: PrivacyLevel;
    };

    createdAt: Date | string;
    updatedAt: Date | string;
}
