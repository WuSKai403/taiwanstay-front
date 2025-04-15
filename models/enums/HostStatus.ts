export enum HostStatus {
  PENDING = 'PENDING',       // 待審核
  ACTIVE = 'ACTIVE',         // 活躍中
  INACTIVE = 'INACTIVE',     // 暫停中
  REJECTED = 'REJECTED',     // 已拒絕
  SUSPENDED = 'SUSPENDED',   // 已暫停（違規）
  EDITING = 'EDITING'        // 編輯中（重新申請）
}