import mongoose, { Schema, Document } from 'mongoose';
import { MessageType } from './enums/MessageType';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  type: MessageType;
  content: string;

  // 媒體
  media?: {
    images?: string[];
    files?: {
      url: string;
      name: string;
      size: number;
      type: string;
    }[];
  };

  // 狀態
  isRead: boolean;
  readAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;

  // 應用相關
  applicationId?: mongoose.Types.ObjectId;
  opportunityId?: mongoose.Types.ObjectId;
  hostId?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: Object.values(MessageType),
    default: MessageType.TEXT
  },
  content: { type: String, required: true },

  // 媒體
  media: {
    images: [{ type: String }],
    files: [{
      url: { type: String },
      name: { type: String },
      size: { type: Number },
      type: { type: String }
    }]
  },

  // 狀態
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },

  // 應用相關
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
  opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity' },
  hostId: { type: Schema.Types.ObjectId, ref: 'Host' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });
MessageSchema.index({ applicationId: 1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);