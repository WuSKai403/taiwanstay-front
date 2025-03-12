import mongoose, { Schema, Document } from 'mongoose';
import { ApplicationStatus } from './enums/ApplicationStatus';

export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  statusNote?: string;

  // 申請資訊
  applicationDetails: {
    message: string;
    startDate: Date;
    endDate?: Date;
    duration: number; // 以天為單位
    travelingWith?: {
      partner: boolean;
      children: boolean;
      pets: boolean;
      details?: string;
    };
    answers?: {
      question: string;
      answer: string;
    }[];
    specialRequirements?: string;
    dietaryRestrictions?: string[];
    languages?: string[];
    relevantExperience?: string;
    motivation?: string;
  };

  // 溝通記錄
  communications: {
    messages: {
      sender: mongoose.Types.ObjectId;
      content: string;
      timestamp: Date;
      read: boolean;
    }[];
    lastMessageAt?: Date;
    unreadHostMessages: number;
    unreadUserMessages: number;
  };

  // 審核資訊
  reviewDetails?: {
    reviewedBy: mongoose.Types.ObjectId;
    reviewedAt: Date;
    notes?: string;
    rating?: number;
  };

  // 確認資訊
  confirmationDetails?: {
    confirmedBy: mongoose.Types.ObjectId;
    confirmedAt: Date;
    arrivalInstructions?: string;
    additionalNotes?: string;
  };

  // 取消資訊
  cancellationDetails?: {
    cancelledBy: mongoose.Types.ObjectId;
    cancelledAt: Date;
    reason?: string;
    initiatedBy: 'host' | 'user';
  };

  // 完成資訊
  completionDetails?: {
    completedAt: Date;
    feedback?: {
      fromHost?: {
        rating: number;
        comment?: string;
        strengths?: string[];
        improvements?: string[];
        wouldHostAgain: boolean;
      };
      fromUser?: {
        rating: number;
        comment?: string;
        strengths?: string[];
        improvements?: string[];
        wouldVisitAgain: boolean;
        workEnvironment: number;
        accommodation: number;
        food: number;
        hostHospitality: number;
        learningOpportunities: number;
      };
    };
  };

  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  hostId: { type: Schema.Types.ObjectId, ref: 'Host', required: true },
  status: {
    type: String,
    enum: Object.values(ApplicationStatus),
    default: ApplicationStatus.PENDING
  },
  statusNote: { type: String },

  // 申請資訊
  applicationDetails: {
    message: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    duration: { type: Number, required: true }, // 以天為單位
    travelingWith: {
      partner: { type: Boolean, default: false },
      children: { type: Boolean, default: false },
      pets: { type: Boolean, default: false },
      details: { type: String }
    },
    answers: [{
      question: { type: String },
      answer: { type: String }
    }],
    specialRequirements: { type: String },
    dietaryRestrictions: [{ type: String }],
    languages: [{ type: String }],
    relevantExperience: { type: String },
    motivation: { type: String }
  },

  // 溝通記錄
  communications: {
    messages: [{
      sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      read: { type: Boolean, default: false }
    }],
    lastMessageAt: { type: Date },
    unreadHostMessages: { type: Number, default: 0 },
    unreadUserMessages: { type: Number, default: 0 }
  },

  // 審核資訊
  reviewDetails: {
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    notes: { type: String },
    rating: { type: Number }
  },

  // 確認資訊
  confirmationDetails: {
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: { type: Date },
    arrivalInstructions: { type: String },
    additionalNotes: { type: String }
  },

  // 取消資訊
  cancellationDetails: {
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    reason: { type: String },
    initiatedBy: { type: String, enum: ['host', 'user'] }
  },

  // 完成資訊
  completionDetails: {
    completedAt: { type: Date },
    feedback: {
      fromHost: {
        rating: { type: Number },
        comment: { type: String },
        strengths: [{ type: String }],
        improvements: [{ type: String }],
        wouldHostAgain: { type: Boolean }
      },
      fromUser: {
        rating: { type: Number },
        comment: { type: String },
        strengths: [{ type: String }],
        improvements: [{ type: String }],
        wouldVisitAgain: { type: Boolean },
        workEnvironment: { type: Number },
        accommodation: { type: Number },
        food: { type: Number },
        hostHospitality: { type: Number },
        learningOpportunities: { type: Number }
      }
    }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

ApplicationSchema.index({ userId: 1, opportunityId: 1 }, { unique: true });
ApplicationSchema.index({ hostId: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ 'applicationDetails.startDate': 1 });
ApplicationSchema.index({ createdAt: 1 });

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);