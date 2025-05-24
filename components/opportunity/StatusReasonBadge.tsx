import { OpportunityStatus } from '@/models/enums';
import { statusColorMap, statusLabelMap } from './constants';
import { getLatestStatusReason } from '@/utils/opportunityUtils';

interface StatusReasonBadgeProps {
  opportunity: any;  // 機會對象
  showLabel?: boolean;  // 是否顯示狀態標籤
  showReason?: boolean;  // 是否顯示原因
  targetStatus?: OpportunityStatus | string;  // 指定狀態，如果不提供則使用機會當前狀態
  className?: string;  // 額外的 CSS 類
  emptyReasonText?: string; // 沒有原因時顯示的文字
}

/**
 * 判斷是否為負面狀態
 */
const isNegativeStatus = (status: OpportunityStatus | string): boolean => {
  return [
    OpportunityStatus.REJECTED,
    OpportunityStatus.PAUSED,
    OpportunityStatus.EXPIRED,
    OpportunityStatus.FILLED,
    OpportunityStatus.ADMIN_PAUSED
  ].includes(status as OpportunityStatus);
};

/**
 * 機會狀態和原因標籤組件
 * 可用於卡片、列表或詳情頁，顯示狀態和相關原因
 */
const StatusReasonBadge: React.FC<StatusReasonBadgeProps> = ({
  opportunity,
  showLabel = true,
  showReason = true,
  targetStatus,
  className = '',
  emptyReasonText = '未提供原因，請聯繫平台管理員了解詳情'
}) => {
  if (!opportunity || !opportunity.status) {
    return null;
  }

  const status = targetStatus || opportunity.status;
  const statusLabel = statusLabelMap[status as OpportunityStatus] || status;
  const statusColor = statusColorMap[status as OpportunityStatus] || 'bg-gray-100 text-gray-800';
  const isNegative = isNegativeStatus(status);

  // 直接獲取原始reason
  const reason = getLatestStatusReason(opportunity.statusHistory, status);

  if (!showReason && !showLabel) {
    return null;
  }

  // 只顯示標籤，沒有原因
  if (showLabel && !showReason) {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor} ${className}`}>
        {statusLabel}
      </span>
    );
  }

  // 顯示原因（負面狀態總是顯示原因UI，即使reason為空）
  if (showReason) {
    // 同時顯示標籤和原因
    if (showLabel) {
      return (
        <div className={`flex flex-col space-y-1 ${className}`}>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor} self-start`}>
            {statusLabel}
          </span>
          {(isNegative || reason !== undefined) && (
            <div className={`p-2 ${isNegative ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'} rounded text-sm`}>
              <p className={isNegative ? 'text-red-700' : 'text-gray-700'}>
                {reason || emptyReasonText}
              </p>
            </div>
          )}
        </div>
      );
    }

    // 只顯示原因，不顯示標籤
    if (isNegative || reason !== undefined) {
      return (
        <div className={`p-2 ${isNegative ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'} rounded text-sm ${className}`}>
          <p className={isNegative ? 'text-red-700' : 'text-gray-700'}>
            {reason || emptyReasonText}
          </p>
        </div>
      );
    }
  }

  // 只有標籤，沒有原因
  if (showLabel) {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor} ${className}`}>
        {statusLabel}
      </span>
    );
  }

  return null;
};

export default StatusReasonBadge;