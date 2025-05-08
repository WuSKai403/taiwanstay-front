import React, { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { OpportunityStatus } from '@/models/enums';
import {
  getNextPossibleStates,
  statusDescriptions,
  getStatusUpdateMessage
} from '@/lib/hooks/useOpportunities';

// 機會狀態標籤顏色映射
const statusColors = {
  [OpportunityStatus.DRAFT]: 'bg-gray-200 text-gray-800',
  [OpportunityStatus.PENDING]: 'bg-blue-100 text-blue-800',
  [OpportunityStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [OpportunityStatus.PAUSED]: 'bg-yellow-100 text-yellow-800',
  [OpportunityStatus.EXPIRED]: 'bg-gray-100 text-gray-600',
  [OpportunityStatus.FILLED]: 'bg-purple-100 text-purple-800',
  [OpportunityStatus.REJECTED]: 'bg-orange-100 text-orange-800',
  [OpportunityStatus.ARCHIVED]: 'bg-red-100 text-red-800',
};

// 機會狀態顯示名稱
const statusLabels = {
  [OpportunityStatus.DRAFT]: '草稿',
  [OpportunityStatus.PENDING]: '待審核',
  [OpportunityStatus.ACTIVE]: '已上架',
  [OpportunityStatus.PAUSED]: '已暫停',
  [OpportunityStatus.EXPIRED]: '已過期',
  [OpportunityStatus.FILLED]: '已滿額',
  [OpportunityStatus.REJECTED]: '已拒絕',
  [OpportunityStatus.ARCHIVED]: '已下架',
};

interface Opportunity {
  _id: string;
  title: string;
  slug: string;
  status: OpportunityStatus;
  shortDescription: string;
  createdAt: string;
  publishedAt?: string;
  media?: {
    coverImage?: string;
    images?: string[];
  };
  stats?: {
    applications?: number;
    views?: number;
    bookmarks?: number;
  };
  rejectionReason?: string;
}

interface OpportunityListProps {
  opportunities: Opportunity[];
  onEdit: (id: string) => void;
  onViewApplications: (id: string) => void;
  onUpdateStatus: (id: string, status: OpportunityStatus, currentStatus: OpportunityStatus) => Promise<any>;
  isUpdating?: boolean;
}

const OpportunityList: React.FC<OpportunityListProps> = ({
  opportunities,
  onEdit,
  onViewApplications,
  onUpdateStatus,
  isUpdating = false,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 獲取狀態切換選項
  const getStatusToggleOptions = (opportunity: Opportunity) => {
    const currentStatus = opportunity.status;
    const nextStates = getNextPossibleStates(currentStatus);

    return nextStates.map(state => ({
      label: getStatusActionLabel(currentStatus, state),
      value: state
    }));
  };

  // 獲取狀態操作的顯示文字
  const getStatusActionLabel = (currentStatus: OpportunityStatus, newStatus: OpportunityStatus): string => {
    switch (newStatus) {
      case OpportunityStatus.DRAFT:
        return currentStatus === OpportunityStatus.PENDING ? '撤回編輯' : '返回編輯';
      case OpportunityStatus.PENDING:
        return '送出審核';
      case OpportunityStatus.ACTIVE:
        return currentStatus === OpportunityStatus.PAUSED ? '恢復招募' :
               currentStatus === OpportunityStatus.FILLED ? '增加名額' : '上架發布';
      case OpportunityStatus.PAUSED:
        return '暫停招募';
      case OpportunityStatus.ARCHIVED:
        return '下架機會';
      default:
        return `變更為${statusLabels[newStatus]}`;
    }
  };

  // 處理狀態更新
  const handleStatusUpdate = async (id: string, newStatus: OpportunityStatus, currentStatus: OpportunityStatus) => {
    try {
      setUpdatingId(id);
      await onUpdateStatus(id, newStatus, currentStatus);
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
      return opportunity.media.coverImage;
    }
    if (opportunity.media?.images && opportunity.media.images.length > 0) {
      return opportunity.media.images[0];
    }
    return '/images/opportunity-placeholder.jpg';
  };

  // 取得編輯按鈕文字
  const getEditButtonText = (status: OpportunityStatus) => {
    switch (status) {
      case OpportunityStatus.DRAFT:
        return '繼續編輯';
      case OpportunityStatus.REJECTED:
        return '查看原因並編輯';
      case OpportunityStatus.PENDING:
        return '查看詳情';
      default:
        return '查看詳情';
    }
  };

  return (
    <div className="space-y-4">
      {opportunities.map((opportunity) => (
        <div
          key={opportunity._id}
          className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="flex flex-col md:flex-row">
            {/* 圖片部分 */}
            <div className="relative w-full md:w-48 h-48">
              <Image
                src={getDefaultImage(opportunity)}
                alt={opportunity.title}
                layout="fill"
                objectFit="cover"
              />
            </div>

            {/* 內容部分 */}
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {opportunity.title}
                </h3>
                <div className="group relative">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[opportunity.status]
                    } cursor-help`}
                  >
                    {statusLabels[opportunity.status]}
                  </span>
                  <div className="absolute z-20 right-0 mt-1 w-64 hidden group-hover:block">
                    <div className="bg-gray-800 text-white text-xs rounded-md p-2">
                      {statusDescriptions[opportunity.status]}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {opportunity.shortDescription || '無描述'}
              </p>

              {opportunity.status === OpportunityStatus.REJECTED && opportunity.rejectionReason && (
                <p className="text-orange-600 text-sm mb-2">
                  拒絕原因: {opportunity.rejectionReason}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-3">
                <span>
                  申請: {opportunity.stats?.applications || 0}
                </span>
                <span>
                  查看: {opportunity.stats?.views || 0}
                </span>
                <span>
                  {getTimeDisplay(opportunity)}
                </span>
              </div>

              {/* 操作按鈕 */}
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => onEdit(opportunity._id)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200 transition-colors"
                >
                  {getEditButtonText(opportunity.status)}
                </button>

                {opportunity.stats?.applications ? (
                  <button
                    onClick={() => onViewApplications(opportunity._id)}
                    className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-md hover:bg-blue-200 transition-colors"
                  >
                    查看申請 ({opportunity.stats.applications})
                  </button>
                ) : null}

                {/* 狀態切換下拉選單 */}
                {getStatusToggleOptions(opportunity).length > 0 && (
                  <div className="relative group">
                    <button
                      className={`px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200 transition-colors ${
                        isUpdating && updatingId === opportunity._id ? 'opacity-50 cursor-wait' : ''
                      }`}
                      disabled={isUpdating && updatingId === opportunity._id}
                    >
                      {isUpdating && updatingId === opportunity._id ? '處理中...' : '更改狀態'}
                    </button>
                    <div className="absolute z-10 left-0 mt-1 w-40 hidden group-hover:block">
                      <div className="bg-white shadow-lg rounded-md border border-gray-200 py-1">
                        {getStatusToggleOptions(opportunity).map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleStatusUpdate(opportunity._id, option.value, opportunity.status)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            disabled={isUpdating}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OpportunityList;