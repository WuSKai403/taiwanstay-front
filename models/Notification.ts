import mongoose, { Schema, Document } from 'mongoose';
import { NotificationType } from './enums/NotificationType';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;

  // 相關資訊
  relatedInfo?: {
    hostId?: mongoose.Types.ObjectId;
    opportunityId?: mongoose.Types.ObjectId;
    applicationId?: mongoose.Types.ObjectId;
    reviewId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    organizationId?: mongoose.Types.ObjectId;
    url?: string;
  };

  // 額外資料
  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },

  // 相關資訊
  relatedInfo: {
    hostId: { type: Schema.Types.ObjectId, ref: 'Host' },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity' },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
    reviewId: { type: Schema.Types.ObjectId, ref: 'Review' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    url: { type: String }
  },

  // 額外資料
  metadata: { type: Schema.Types.Mixed },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ 'relatedInfo.hostId': 1 });
NotificationSchema.index({ 'relatedInfo.opportunityId': 1 });
NotificationSchema.index({ 'relatedInfo.applicationId': 1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);