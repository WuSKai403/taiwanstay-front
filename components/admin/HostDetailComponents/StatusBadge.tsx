import React from 'react';
import { HostStatus } from '@/models/enums/HostStatus';

interface StatusBadgeProps {
  status: HostStatus;
}

// 狀態標籤組件
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig: Record<HostStatus, { text: string; bgColor: string; textColor: string }> = {
    [HostStatus.PENDING]: { text: '待審核', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    [HostStatus.ACTIVE]: { text: '活躍中', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    [HostStatus.INACTIVE]: { text: '暫停中', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    [HostStatus.REJECTED]: { text: '已拒絕', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    [HostStatus.SUSPENDED]: { text: '已暫停', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    [HostStatus.EDITING]: { text: '編輯中', bgColor: 'bg-blue-100', textColor: 'text-blue-800' }
  };

  const config = statusConfig[status] || { text: '未知', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
      {config.text}
    </span>
  );
};

export default StatusBadge;