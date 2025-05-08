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
  statusHistory: {
    status: HostStatus;
    statusNote?: string;
    updatedBy?: mongoose.Types.ObjectId;
    updatedAt: Date;
  }[];
  type: HostType;
  category: string;
  verified: boolean;
  verifiedAt?: Date;
  email: string;  // 頂層通訊欄位(註冊登入用)
  mobile: string; // 頂層通訊欄位(註冊登入用)

  // 聯絡資訊
  contactInfo: {
    contactEmail: string;
    phone?: string;
    contactMobile: string;
    website?: string;
    contactHours?: string;
    notes?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      line?: string;
      threads?: string;
      linkedin?: string;
      twitter?: string;
      youtube?: string;
      tiktok?: string;
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
    showExactLocation?: boolean;
  };

  // 照片與影片資訊 (MediaUploadStep 結構)
  photos?: {
    publicId: string;
    secureUrl: string;
    thumbnailUrl?: string;
    previewUrl?: string;
    originalUrl?: string;
  }[];
  photoDescriptions?: string[];
  videoIntroduction?: {
    url: string;
    description?: string;
  };
  additionalMedia?: {
    virtualTour?: string;
    presentation?: {
      publicId: string;
      secureUrl: string;
      thumbnailUrl?: string;
      previewUrl?: string;
      originalUrl?: string;
    };
  };

  // 設施與服務
  amenities: {
    basics?: {
      wifi?: boolean;
      parking?: boolean;
      elevator?: boolean;
      airConditioner?: boolean;
      heater?: boolean;
      washingMachine?: boolean;
    };
    accommodation?: {
      privateRoom?: boolean;
      sharedRoom?: boolean;
      camping?: boolean;
      kitchen?: boolean;
      bathroom?: boolean;
      sharedBathroom?: boolean;
    };
    workExchange?: {
      workingDesk?: boolean;
      internetAccess?: boolean;
      toolsProvided?: boolean;
      trainingProvided?: boolean;
      flexibleHours?: boolean;
    };
    lifestyle?: {
      petFriendly?: boolean;
      smokingAllowed?: boolean;
      childFriendly?: boolean;
      organic?: boolean;
      vegetarian?: boolean;
      ecoFriendly?: boolean;
    };
    activities?: {
      yoga?: boolean;
      meditation?: boolean;
      freeDiving?: boolean;
      scubaDiving?: boolean;
      hiking?: boolean;
      farmingActivities?: boolean;
      culturalExchange?: boolean;
    };
    customAmenities?: string[];
    amenitiesNotes?: string;
    workExchangeDescription?: string;
  };

  // 主辦方詳細資訊
  details: {
    foundingYear?: number;
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
    rules?: string[];
    expectations?: string[];
  };

  // 主人特點與描述
  features?: {
    features?: string[];
    story?: string;
    experience?: string;
    environment?: {
      surroundings?: string;
      accessibility?: string;
      nearbyAttractions?: string[];
    };
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
  statusHistory: [{
    status: {
      type: String,
      enum: Object.values(HostStatus)
    },
    statusNote: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
  }],
  type: {
    type: String,
    enum: Object.values(HostType),
    required: true
  },
  category: { type: String, required: true },
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  email: { type: String, required: true }, // 頂層通訊欄位(註冊登入用)
  mobile: { type: String, required: true }, // 頂層通訊欄位(註冊登入用)

  // 聯絡資訊
  contactInfo: {
    contactEmail: { type: String, required: true },
    phone: { type: String },
    contactMobile: { type: String, required: true },
    website: { type: String },
    contactHours: { type: String },
    notes: { type: String },
    socialMedia: {
      facebook: { type: String },
      instagram: { type: String },
      line: { type: String },
      threads: { type: String },
      linkedin: { type: String },
      twitter: { type: String },
      youtube: { type: String },
      tiktok: { type: String },
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
    },
    showExactLocation: { type: Boolean, default: true }
  },

  // 媒體資訊 (根據 MediaUploadStep 結構調整)
  photos: [{
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    previewUrl: { type: String },
    originalUrl: { type: String }
  }],
  photoDescriptions: [{ type: String }],
  videoIntroduction: {
    url: { type: String },
    description: { type: String }
  },
  additionalMedia: {
    virtualTour: { type: String },
    presentation: {
      publicId: { type: String },
      secureUrl: { type: String },
      thumbnailUrl: { type: String },
      previewUrl: { type: String },
      originalUrl: { type: String }
    }
  },

  // 設施與服務
  amenities: {
    basics: {
      wifi: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      elevator: { type: Boolean, default: false },
      airConditioner: { type: Boolean, default: false },
      heater: { type: Boolean, default: false },
      washingMachine: { type: Boolean, default: false }
    },
    accommodation: {
      privateRoom: { type: Boolean, default: false },
      sharedRoom: { type: Boolean, default: false },
      camping: { type: Boolean, default: false },
      kitchen: { type: Boolean, default: false },
      bathroom: { type: Boolean, default: false },
      sharedBathroom: { type: Boolean, default: false }
    },
    workExchange: {
      workingDesk: { type: Boolean, default: false },
      internetAccess: { type: Boolean, default: false },
      toolsProvided: { type: Boolean, default: false },
      trainingProvided: { type: Boolean, default: false },
      flexibleHours: { type: Boolean, default: false }
    },
    lifestyle: {
      petFriendly: { type: Boolean, default: false },
      smokingAllowed: { type: Boolean, default: false },
      childFriendly: { type: Boolean, default: false },
      organic: { type: Boolean, default: false },
      vegetarian: { type: Boolean, default: false },
      ecoFriendly: { type: Boolean, default: false }
    },
    activities: {
      yoga: { type: Boolean, default: false },
      meditation: { type: Boolean, default: false },
      freeDiving: { type: Boolean, default: false },
      scubaDiving: { type: Boolean, default: false },
      hiking: { type: Boolean, default: false },
      farmingActivities: { type: Boolean, default: false },
      culturalExchange: { type: Boolean, default: false }
    },
    customAmenities: [{ type: String }],
    amenitiesNotes: { type: String },
    workExchangeDescription: { type: String }
  },

  // 主辦方詳細資訊
  details: {
    foundingYear: { type: Number },
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
    rules: [{ type: String }],
    expectations: [{ type: String }]
  },

  // 主人特點與描述
  features: {
    features: [{ type: String }],
    story: { type: String },
    experience: { type: String },
    environment: {
      surroundings: { type: String },
      accessibility: { type: String },
      nearbyAttractions: [{ type: String }]
    }
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