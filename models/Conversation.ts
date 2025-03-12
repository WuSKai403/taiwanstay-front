import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: {
    content: string;
    senderId: mongoose.Types.ObjectId;
    timestamp: Date;
    isRead: boolean;
  };

  // 相關資訊
  relatedInfo?: {
    applicationId?: mongoose.Types.ObjectId;
    opportunityId?: mongoose.Types.ObjectId;
    hostId?: mongoose.Types.ObjectId;
  };

  // 統計資訊
  stats: {
    messageCount: number;
    unreadCount: {
      [key: string]: number; // userId: unreadCount
    };
  };

  // 狀態
  isArchived: {
    [key: string]: boolean; // userId: isArchived
  };

  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: {
    content: { type: String },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date },
    isRead: { type: Boolean, default: false }
  },

  // 相關資訊
  relatedInfo: {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity' },
    hostId: { type: Schema.Types.ObjectId, ref: 'Host' }
  },

  // 統計資訊
  stats: {
    messageCount: { type: Number, default: 0 },
    unreadCount: { type: Map, of: Number, default: {} }
  },

  // 狀態
  isArchived: { type: Map, of: Boolean, default: {} },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ 'relatedInfo.applicationId': 1 });
ConversationSchema.index({ 'relatedInfo.opportunityId': 1 });
ConversationSchema.index({ 'relatedInfo.hostId': 1 });
ConversationSchema.index({ 'lastMessage.timestamp': -1 });

export default mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);