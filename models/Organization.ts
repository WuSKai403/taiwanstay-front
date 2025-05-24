import mongoose, { Schema, Document } from 'mongoose';
import { OrganizationStatus } from './enums/OrganizationStatus';
import { OrganizationType } from './enums/OrganizationType';
import { MediaImage } from '@/lib/types/media';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  description: string;
  mission?: string;
  vision?: string;
  status: OrganizationStatus;
  statusNote?: string;
  type: OrganizationType;
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
      linkedin?: string;
      twitter?: string;
      youtube?: string;
      threads?: string;
      tiktok?: string;
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
    coordinates?: {
      type: string;
      coordinates: number[];
    };
  };

  // 媒體資訊
  media: {
    logo?: MediaImage;
    coverImage?: MediaImage;
    gallery?: MediaImage[];
    videos?: string[];
  };

  // 組織詳細資訊
  details: {
    foundedYear?: number;
    teamSize?: number;
    languages?: string[];
    focusAreas?: string[];
    registrationNumber?: string;
    legalStatus?: string;
  };

  // 管理員
  admins: mongoose.Types.ObjectId[];

  // 關聯的主辦方
  hosts: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, required: true },
  mission: { type: String },
  vision: { type: String },
  status: {
    type: String,
    enum: Object.values(OrganizationStatus),
    default: OrganizationStatus.PENDING
  },
  statusNote: { type: String },
  type: {
    type: String,
    enum: Object.values(OrganizationType),
    required: true
  },
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
      linkedin: { type: String },
      twitter: { type: String },
      youtube: { type: String },
      threads: { type: String },
      tiktok: { type: String },
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
      coordinates: [Number]
    }
  },

  // 媒體資訊
  media: {
    logo: { type: Object },
    coverImage: { type: Object },
    gallery: [{ type: Object }],
    videos: [{ type: String }]
  },

  // 組織詳細資訊
  details: {
    foundedYear: { type: Number },
    teamSize: { type: Number },
    languages: [{ type: String }],
    focusAreas: [{ type: String }],
    registrationNumber: { type: String },
    legalStatus: { type: String }
  },

  // 管理員
  admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],

  // 關聯的主辦方
  hosts: [{ type: Schema.Types.ObjectId, ref: 'Host' }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

OrganizationSchema.index({ 'location.coordinates': '2dsphere' });
OrganizationSchema.index({ name: 'text', description: 'text', mission: 'text', vision: 'text' });
OrganizationSchema.index({ slug: 1 }, { unique: true });

export default mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);