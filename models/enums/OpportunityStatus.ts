export enum OpportunityStatus {
  DRAFT = 'DRAFT',           // 草稿
  PENDING = 'PENDING',       // 待審核
  ACTIVE = 'ACTIVE',         // 活躍中
  PAUSED = 'PAUSED',         // 已下架
  EXPIRED = 'EXPIRED',       // 已過期
  FILLED = 'FILLED',         // 已滿額
  REJECTED = 'REJECTED',     // 已拒絕
  ADMIN_PAUSED = 'ADMIN_PAUSED', // 管理員暫停
  // ARCHIVED = 'ARCHIVED'      // 已封存不使用
}