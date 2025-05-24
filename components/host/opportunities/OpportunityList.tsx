import React, { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { OpportunityStatus } from '@/models/enums';
import {
  statusDescriptions,
  statusColorMap,
  statusLabelMap,
  statusActions,
  getStatusUpdateMessage,
  getPrimaryAction,
  getSecondaryActions,
  getNextAllowedStates as getNextPossibleStates
} from '@/lib/opportunities/statusManager';
import StatusReasonBadge from '@/components/opportunity/StatusReasonBadge';
import StatusActionDropdown from '@/components/opportunity/StatusActionDropdown';
import { OpportunityMedia } from '@/lib/types/media';
import { UserRole } from '@/models/enums';

interface Opportunity {
  _id: string;
  title: string;
  slug: string;
  status: OpportunityStatus;
  shortDescription: string;
  createdAt: string;
  publishedAt?: string;
  media?: OpportunityMedia;
  stats?: {
    applications?: number;
    views?: number;
    bookmarks?: number;
  };
  statusHistory: Array<{
    status: OpportunityStatus;
    reason?: string;
    changedBy?: string;
    changedAt: string;
  }>;
}

interface OpportunityListProps {
  opportunities: Opportunity[];
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onViewApplications: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: OpportunityStatus, currentStatus: OpportunityStatus, reason?: string) => void;
  isUpdating?: boolean;
}

const OpportunityList: React.FC<OpportunityListProps> = ({
  opportunities,
  onEdit,
  onView,
  onViewApplications,
  onUpdateStatus,
  isUpdating = false,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 獲取狀態切換選項
  const getStatusToggleOptions = (opportunity: Opportunity) => {
    const currentStatus = opportunity.status;
    const possibleActions = getSecondaryActions(currentStatus);

    return possibleActions
      .filter(action => action.targetStatus !== null) // 排除僅保存動作
      .map(action => ({
        label: action.actionLabel,
        value: action.targetStatus as OpportunityStatus
      }));
  };

  // 處理狀態更新
  const handleStatusUpdate = async (id: string, newStatus: OpportunityStatus, currentStatus: OpportunityStatus, reason?: string) => {
    try {
      setUpdatingId(id);
      await onUpdateStatus(id, newStatus, currentStatus, reason);
      alert(getStatusUpdateMessage(newStatus));
    } catch (error) {
      console.error('更新狀態失敗:', error);
      alert(`更新狀態失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: zhTW });
    } catch (error) {
      return '未知日期';
    }
  };

  // 獲取適當的時間顯示（創建時間或發布時間）
  const getTimeDisplay = (opportunity: Opportunity) => {
    if (opportunity.status === OpportunityStatus.ACTIVE && opportunity.publishedAt) {
      return `發布: ${formatDate(opportunity.publishedAt)}`;
    }
    return `創建: ${formatDate(opportunity.createdAt)}`;
  };

  // 獲取預設圖片
  const getDefaultImage = (opportunity: Opportunity) => {
    if (opportunity.media?.coverImage) {
      return opportunity.media.coverImage.secureUrl || opportunity.media.coverImage.url || '/images/defaults/opportunity.jpg';
    }
    if (opportunity.media?.images && opportunity.media.images.length > 0) {
      return opportunity.media.images[0].secureUrl || opportunity.media.images[0].url || '/images/defaults/opportunity.jpg';
    }
    return '/images/defaults/opportunity.jpg';
  };

  // 取得最優先的行動按鈕信息
  const getPriorityAction = (status: OpportunityStatus) => {
    const primaryAction = getPrimaryAction(status);

    if (status === OpportunityStatus.DRAFT || status === OpportunityStatus.REJECTED) {
      return {
        action: 'edit',
        label: status === OpportunityStatus.REJECTED ? '查看原因並編輯' : '繼續編輯'
      };
    }

    return {
      action: 'view',
      label: '查看詳情'
    };
  };

  const renderStatusBadge = (status: OpportunityStatus) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorMap[status]}`}>
        {statusLabelMap[status]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {opportunities.map((opportunity) => {
        const currentStatus = opportunity.status;
        const priorityAction = getPriorityAction(currentStatus);
        const statusOptions = getStatusToggleOptions(opportunity);

        return (
          <div
            key={opportunity._id}
            className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {opportunity.title}
                </h3>
                {renderStatusBadge(opportunity.status)}
              </div>

              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {opportunity.shortDescription || '無描述'}
              </p>

              {/* 狀態原因顯示 */}
              {(opportunity.status === OpportunityStatus.REJECTED ||
                opportunity.status === OpportunityStatus.PAUSED) && (
                <div className="my-2">
                  <StatusReasonBadge
                    opportunity={opportunity}
                    showLabel={false}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-3">
                <span>申請數: {opportunity.stats?.applications || 0}</span>
                <span>查看數: {opportunity.stats?.views || 0}</span>
                <span>收藏數: {opportunity.stats?.bookmarks || 0}</span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => priorityAction.action === 'edit' ? onEdit(opportunity._id) : onView(opportunity._id)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200 transition-colors"
                >
                  {priorityAction.label}
                </button>

                {opportunity.status === OpportunityStatus.ACTIVE && (
                  <button
                    onClick={() => onViewApplications(opportunity._id)}
                    className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-md hover:bg-blue-200 transition-colors"
                  >
                    查看申請
                  </button>
                )}

                {/* 使用 StatusActionDropdown 組件 */}
                <StatusActionDropdown
                  currentStatus={opportunity.status}
                  onStatusUpdate={(newStatus, reason) =>
                    handleStatusUpdate(opportunity._id, newStatus, opportunity.status, reason)
                  }
                  showSaveAction={false}
                  userRole={UserRole.HOST}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OpportunityList;