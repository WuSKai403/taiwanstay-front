export enum ApplicationStatus {
  DRAFT = 'DRAFT',           // 草稿
  PENDING = 'PENDING',       // 待審核（包含審核中）
  ACCEPTED = 'ACCEPTED',     // 已接受
  REJECTED = 'REJECTED',     // 已拒絕
  ACTIVE = 'ACTIVE',         // 已確認（正在進行中）
  COMPLETED = 'COMPLETED',   // 已完成（包含已取消和已撤回）
}