export enum ApplicationStatus {
  DRAFT = 'DRAFT',           // 草稿
  PENDING = 'PENDING',       // 待審核
  REVIEWING = 'REVIEWING',   // 審核中
  ACCEPTED = 'ACCEPTED',     // 已接受
  REJECTED = 'REJECTED',     // 已拒絕
  CONFIRMED = 'CONFIRMED',   // 已確認
  CANCELLED = 'CANCELLED',   // 已取消
  COMPLETED = 'COMPLETED',   // 已完成
  WITHDRAWN = 'WITHDRAWN'    // 已撤回
}