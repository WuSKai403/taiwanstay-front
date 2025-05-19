import { OpportunityStatus } from '@/models/enums';

/**
 * 狀態歷史記錄項目的類型定義
 */
export interface StatusHistoryItem {
  status: OpportunityStatus | string;
  reason?: string;
  changedBy?: string;
  changedAt: string | Date;
}

/**
 * 獲取機會最新的特定狀態原因
 * @param statusHistory 狀態歷史記錄陣列
 * @param targetStatus 目標狀態
 * @returns 找到的狀態原因或 undefined
 */
export function getLatestStatusReason(
  statusHistory?: StatusHistoryItem[],
  targetStatus?: OpportunityStatus | string
): string | undefined {
  if (!statusHistory || !statusHistory.length || !targetStatus) {
    return undefined;
  }

  // 按時間降序排序，確保最新的記錄排在前面
  const sortedHistory = [...statusHistory].sort((a, b) => {
    const dateA = a.changedAt instanceof Date ? a.changedAt : new Date(a.changedAt);
    const dateB = b.changedAt instanceof Date ? b.changedAt : new Date(b.changedAt);
    return dateB.getTime() - dateA.getTime();
  });

  // 找到第一個（最新的）符合目標狀態的記錄
  const targetItem = sortedHistory.find(item => item.status === targetStatus);
  return targetItem?.reason;
}

/**
 * 獲取機會目前狀態的原因（基於當前狀態和狀態歷史）
 * @param currentStatus 當前狀態
 * @param statusHistory 狀態歷史記錄陣列
 * @returns 當前狀態的原因或 undefined
 */
export function getCurrentStatusReason(
  currentStatus?: OpportunityStatus | string,
  statusHistory?: StatusHistoryItem[]
): string | undefined {
  if (!currentStatus || !statusHistory || !statusHistory.length) {
    return undefined;
  }

  return getLatestStatusReason(statusHistory, currentStatus);
}

/**
 * 為指定機會獲取狀態標籤和原因
 * @param opportunity 機會對象
 * @returns 包含狀態和原因的對象
 */
export function getOpportunityStatusInfo(opportunity: any): {
  status: OpportunityStatus | string;
  reason?: string;
} {
  if (!opportunity) {
    return { status: 'unknown' };
  }

  const status = opportunity.status;
  const reason = getCurrentStatusReason(status, opportunity.statusHistory);

  return { status, reason };
}

/**
 * 檢查機會是否有指定狀態的原因
 * @param opportunity 機會對象
 * @param status 要檢查的狀態
 * @returns 是否有該狀態的原因
 */
export function hasStatusReason(
  opportunity: any,
  status: OpportunityStatus | string
): boolean {
  if (!opportunity?.statusHistory) {
    return false;
  }

  const reason = getLatestStatusReason(opportunity.statusHistory, status);
  return reason !== undefined && reason !== '';
}