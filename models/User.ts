import mongoose, { Schema, Document } from 'mongoose';
import { PrivacyLevel } from './enums/PrivacyLevel';
import { UserRole } from './enums/UserRole';

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  emailVerified?: Date;
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
      birthdate?: Date;
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
      availableFrom?: Date;
      availableTo?: Date;
      minDuration?: number; // 最短可停留天數
      maxDuration?: number; // 最長可停留天數
      hasDriverLicense?: boolean;
      dietaryRestrictions?: string[];
      specialNeeds?: string;
      notes?: string;
    };
    // 基本個人資訊
    birthDate: Date;
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
  hostId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;

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

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, '姓名為必填欄位'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, '電子郵件為必填欄位'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  image: {
    type: String,
  },
  emailVerified: { type: Date },
  password: { type: String },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER,
  },
  profile: {
    avatar: String,
    bio: String,
    skills: [String],
    languages: [String],
    location: {
      type: { type: String, enum: ['Point'], required: false },
      coordinates: { type: [Number], required: false }
    },
    // 社交媒體帳號
    socialMedia: {
      instagram: String,
      facebook: String,
      threads: String,
      linkedin: String,
      twitter: String,
      youtube: String,
      tiktok: String,
      website: String,
      other: [{
        name: String,
        url: String
      }]
    },
    // 個人資訊
    personalInfo: {
      birthdate: Date,
      gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say']
      },
      nationality: String,
      currentLocation: String,
      occupation: String,
      education: String
    },
    // 工作換宿偏好
    workExchangePreferences: {
      preferredWorkTypes: [String],
      preferredLocations: [String],
      availableFrom: Date,
      availableTo: Date,
      minDuration: Number,
      maxDuration: Number,
      hasDriverLicense: Boolean,
      dietaryRestrictions: [String],
      specialNeeds: String,
      notes: String
    },
    // 基本個人資訊
    birthDate: { type: Date, required: true },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
      email: String
    },
    // 工作能力相關
    workExperience: [{
      title: { type: String, required: true },
      description: String,
      duration: String
    }],
    physicalCondition: { type: String, required: true },
    dietaryRestrictions: [String],
    // 交流期望
    preferredWorkHours: { type: Number, required: true },
    accommodationNeeds: String,
    culturalInterests: [String],
    learningGoals: [String],
    // 基本安全驗證
    phoneNumber: String,
    isPhoneVerified: { type: Boolean, default: false },
  },
  hostId: { type: Schema.Types.ObjectId, ref: 'Host' },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },

  // 隱私設置
  privacySettings: {
    // 基本資訊隱私設置
    email: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.PRIVATE },
    phone: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.PRIVATE },

    // 個人資訊隱私設置
    personalInfo: {
      birthdate: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
      gender: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
      nationality: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
      currentLocation: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
      occupation: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
      education: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
    },

    // 社交媒體隱私設置
    socialMedia: {
      instagram: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
      facebook: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
      threads: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
      linkedin: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
      twitter: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
      youtube: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
      tiktok: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
      website: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
      other: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },
    },

    // 工作換宿偏好隱私設置
    workExchangePreferences: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.REGISTERED },

    // 其他設置
    skills: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.PUBLIC },
    languages: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.PUBLIC },
    bio: { type: String, enum: Object.values(PrivacyLevel), default: PrivacyLevel.PUBLIC },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// 使用sparse索引，只有當location欄位存在時才建立索引
UserSchema.index({ 'profile.location': '2dsphere' }, { sparse: true });

// 使用 mongoose.models 檢查模型是否已經存在，避免在熱重載時重複定義
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);