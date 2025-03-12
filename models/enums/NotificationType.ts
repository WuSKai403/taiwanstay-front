export enum NotificationType {
  // 申請相關
  APPLICATION_RECEIVED = 'APPLICATION_RECEIVED',   // 收到申請
  APPLICATION_ACCEPTED = 'APPLICATION_ACCEPTED',   // 申請被接受
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',   // 申請被拒絕
  APPLICATION_CONFIRMED = 'APPLICATION_CONFIRMED', // 申請被確認
  APPLICATION_CANCELLED = 'APPLICATION_CANCELLED', // 申請被取消
  APPLICATION_UPDATED = 'APPLICATION_UPDATED',     // 申請被更新

  // 消息相關
  NEW_MESSAGE = 'NEW_MESSAGE',                     // 新消息

  // 評價相關
  NEW_REVIEW = 'NEW_REVIEW',                       // 新評價
  REVIEW_RESPONSE = 'REVIEW_RESPONSE',             // 評價回覆

  // 主辦方相關
  HOST_STATUS_CHANGED = 'HOST_STATUS_CHANGED',     // 主辦方狀態變更
  HOST_VERIFIED = 'HOST_VERIFIED',                 // 主辦方已驗證

  // 機會相關
  OPPORTUNITY_STATUS_CHANGED = 'OPPORTUNITY_STATUS_CHANGED', // 機會狀態變更
  OPPORTUNITY_EXPIRING = 'OPPORTUNITY_EXPIRING',   // 機會即將過期

  // 系統相關
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',     // 系統公告
  ACCOUNT_VERIFICATION = 'ACCOUNT_VERIFICATION',   // 帳號驗證
  PASSWORD_RESET = 'PASSWORD_RESET',               // 密碼重設

  // 其他
  CUSTOM = 'CUSTOM'                                // 自定義通知
}