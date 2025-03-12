import mongoose, { Schema, Document } from 'mongoose';
import { HostStatus } from './enums/HostStatus';
import { HostType } from './enums/HostType';

export interface IHost extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  status: HostStatus;
  statusNote?: string;
  type: HostType;
  category: string;
  verified: boolean;
  verifiedAt?: Date;

  // 聯絡資訊
  contactInfo: {
    email: string;
    phone?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      line?: string;
      other?: {
        name: string;
        url: string;
      }[];
    };
  };

  // 地址資訊
  location: {
    address: string;
    city: string;
    district?: string;
    zipCode?: string;
    country: string;
    coordinates: {
      type: string;
      coordinates: number[];
    };
  };

  // 媒體資訊
  media: {
    logo?: string;
    coverImage?: string;
    gallery?: string[];
    videos?: string[];
  };

  // 設施與服務
  amenities: {
    hasWifi: boolean;
    hasParking: boolean;
    hasMeals: boolean;
    hasPrivateRoom: boolean;
    hasSharedRoom: boolean;
    hasCamping: boolean;
    hasKitchen: boolean;
    hasShower: boolean;
    hasHeating: boolean;
    hasAirConditioning: boolean;
    hasWashingMachine: boolean;
    hasPets: boolean;
    isSmokingAllowed: boolean;
    isChildFriendly: boolean;
    isAccessible: boolean;
    other?: string[];
  };

  // 主辦方詳細資訊
  details: {
    foundedYear?: number;
    teamSize?: number;
    languages?: string[];
    acceptsChildren?: boolean;
    acceptsPets?: boolean;
    acceptsCouples?: boolean;
    minStayDuration?: number;
    maxStayDuration?: number;
    workHoursPerWeek?: number;
    workDaysPerWeek?: number;
    providesAccommodation: boolean;
    providesMeals: boolean;
    dietaryOptions?: string[];
    seasonalAvailability?: {
      spring: boolean;
      summer: boolean;
      autumn: boolean;
      winter: boolean;
    };
    rules?: string[];
    expectations?: string[];
  };

  // 評價與評分
  ratings: {
    overall: number;
    workEnvironment: number;
    accommodation: number;
    food: number;
    hostHospitality: number;
    learningOpportunities: number;
    reviewCount: number;
  };

  organizationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HostSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: Object.values(HostStatus),
    default: HostStatus.PENDING
  },
  statusNote: { type: String },
  type: {
    type: String,
    enum: Object.values(HostType),
    required: true
  },
  category: { type: String, required: true },
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date },

  // 聯絡資訊
  contactInfo: {
    email: { type: String, required: true },
    phone: { type: String },
    website: { type: String },
    socialMedia: {
      facebook: { type: String },
      instagram: { type: String },
      line: { type: String },
      other: [{
        name: { type: String },
        url: { type: String }
      }]
    }
  },

  // 地址資訊
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String },
    zipCode: { type: String },
    country: { type: String, required: true },
    coordinates: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], required: true }
    }
  },

  // 媒體資訊
  media: {
    logo: { type: String },
    coverImage: { type: String },
    gallery: [{ type: String }],
    videos: [{ type: String }]
  },

  // 設施與服務
  amenities: {
    hasWifi: { type: Boolean, default: false },
    hasParking: { type: Boolean, default: false },
    hasMeals: { type: Boolean, default: false },
    hasPrivateRoom: { type: Boolean, default: false },
    hasSharedRoom: { type: Boolean, default: false },
    hasCamping: { type: Boolean, default: false },
    hasKitchen: { type: Boolean, default: false },
    hasShower: { type: Boolean, default: false },
    hasHeating: { type: Boolean, default: false },
    hasAirConditioning: { type: Boolean, default: false },
    hasWashingMachine: { type: Boolean, default: false },
    hasPets: { type: Boolean, default: false },
    isSmokingAllowed: { type: Boolean, default: false },
    isChildFriendly: { type: Boolean, default: false },
    isAccessible: { type: Boolean, default: false },
    other: [{ type: String }]
  },

  // 主辦方詳細資訊
  details: {
    foundedYear: { type: Number },
    teamSize: { type: Number },
    languages: [{ type: String }],
    acceptsChildren: { type: Boolean, default: false },
    acceptsPets: { type: Boolean, default: false },
    acceptsCouples: { type: Boolean, default: false },
    minStayDuration: { type: Number },
    maxStayDuration: { type: Number },
    workHoursPerWeek: { type: Number },
    workDaysPerWeek: { type: Number },
    providesAccommodation: { type: Boolean, default: true },
    providesMeals: { type: Boolean, default: false },
    dietaryOptions: [{ type: String }],
    seasonalAvailability: {
      spring: { type: Boolean, default: true },
      summer: { type: Boolean, default: true },
      autumn: { type: Boolean, default: true },
      winter: { type: Boolean, default: true }
    },
    rules: [{ type: String }],
    expectations: [{ type: String }]
  },

  // 評價與評分
  ratings: {
    overall: { type: Number, default: 0 },
    workEnvironment: { type: Number, default: 0 },
    accommodation: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    hostHospitality: { type: Number, default: 0 },
    learningOpportunities: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }
  },

  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

HostSchema.index({ 'location.coordinates': '2dsphere' });
HostSchema.index({ name: 'text', description: 'text' });
HostSchema.index({ slug: 1 }, { unique: true });

export default mongoose.models.Host || mongoose.model<IHost>('Host', HostSchema);