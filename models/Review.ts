import mongoose, { Schema, Document } from 'mongoose';
import { ReviewType } from './enums/ReviewType';

export interface IReview extends Document {
  type: ReviewType;
  userId: mongoose.Types.ObjectId;
  hostId?: mongoose.Types.ObjectId;
  opportunityId?: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;

  // 評分
  rating: {
    overall: number;
    workEnvironment?: number;
    accommodation?: number;
    food?: number;
    hostHospitality?: number;
    learningOpportunities?: number;
    communication?: number;
    accuracy?: number;
    location?: number;
    value?: number;
  };

  // 評價內容
  content: {
    title?: string;
    comment: string;
    strengths?: string[];
    improvements?: string[];
    tips?: string;
    wouldRecommend: boolean;
  };

  // 媒體
  media?: {
    images?: string[];
    videos?: string[];
  };

  // 回覆
  response?: {
    userId: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  };

  // 有用標記
  helpfulMarks: number;

  // 狀態
  isVerified: boolean;
  isPublic: boolean;
  isReported: boolean;
  reportReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema({
  type: {
    type: String,
    enum: Object.values(ReviewType),
    required: true
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hostId: { type: Schema.Types.ObjectId, ref: 'Host' },
  opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity' },
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },

  // 評分
  rating: {
    overall: { type: Number, required: true, min: 1, max: 5 },
    workEnvironment: { type: Number, min: 1, max: 5 },
    accommodation: { type: Number, min: 1, max: 5 },
    food: { type: Number, min: 1, max: 5 },
    hostHospitality: { type: Number, min: 1, max: 5 },
    learningOpportunities: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    accuracy: { type: Number, min: 1, max: 5 },
    location: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 }
  },

  // 評價內容
  content: {
    title: { type: String },
    comment: { type: String, required: true },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    tips: { type: String },
    wouldRecommend: { type: Boolean, required: true }
  },

  // 媒體
  media: {
    images: [{ type: String }],
    videos: [{ type: String }]
  },

  // 回覆
  response: {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String },
    createdAt: { type: Date, default: Date.now }
  },

  // 有用標記
  helpfulMarks: { type: Number, default: 0 },

  // 狀態
  isVerified: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true },
  isReported: { type: Boolean, default: false },
  reportReason: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// 確保每個用戶只能對特定主辦方/機會評價一次
ReviewSchema.index({ userId: 1, hostId: 1, type: 1 }, { unique: true, partialFilterExpression: { hostId: { $exists: true } } });
ReviewSchema.index({ userId: 1, opportunityId: 1, type: 1 }, { unique: true, partialFilterExpression: { opportunityId: { $exists: true } } });
ReviewSchema.index({ applicationId: 1, type: 1 }, { unique: true, partialFilterExpression: { applicationId: { $exists: true } } });

// 其他索引
ReviewSchema.index({ hostId: 1, isPublic: 1 });
ReviewSchema.index({ opportunityId: 1, isPublic: 1 });
ReviewSchema.index({ 'rating.overall': 1 });
ReviewSchema.index({ createdAt: 1 });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);