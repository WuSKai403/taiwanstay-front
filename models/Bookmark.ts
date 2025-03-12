import mongoose, { Schema, Document } from 'mongoose';
import { BookmarkType } from './enums/BookmarkType';

export interface IBookmark extends Document {
  userId: mongoose.Types.ObjectId;
  type: BookmarkType;
  hostId?: mongoose.Types.ObjectId;
  opportunityId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: Object.values(BookmarkType),
    required: true
  },
  hostId: { type: Schema.Types.ObjectId, ref: 'Host' },
  opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity' },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// 確保每個用戶只能收藏特定主辦方/機會/組織一次
BookmarkSchema.index({ userId: 1, hostId: 1 }, { unique: true, partialFilterExpression: { hostId: { $exists: true } } });
BookmarkSchema.index({ userId: 1, opportunityId: 1 }, { unique: true, partialFilterExpression: { opportunityId: { $exists: true } } });
BookmarkSchema.index({ userId: 1, organizationId: 1 }, { unique: true, partialFilterExpression: { organizationId: { $exists: true } } });

// 其他索引
BookmarkSchema.index({ userId: 1, type: 1 });
BookmarkSchema.index({ createdAt: 1 });

export default mongoose.models.Bookmark || mongoose.model<IBookmark>('Bookmark', BookmarkSchema);