import React from 'react';
import { HostStatus } from '@/models/enums/HostStatus';
import { shouldShowButton } from './utils';

// 狀態處理按鈕組件接口
interface StatusActionButtonProps {
  status: HostStatus;
  onStatusChange: (status: HostStatus) => void;
  targetStatus: HostStatus;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  label: string;
}

// 狀態處理按鈕組件
const StatusActionButton: React.FC<StatusActionButtonProps> = ({
  status,
  onStatusChange,
  targetStatus,
  icon,
  color,
  hoverColor,
  label
}) => {
  if (!shouldShowButton(status, targetStatus)) {
    return null;
  }

  return (
    <button
      onClick={() => onStatusChange(targetStatus)}
      className={`flex items-center px-4 py-2 rounded-md font-medium ${color} ${hoverColor} transition-colors`}
    >
      {icon && icon}
      <span className={icon ? "ml-2" : ""}>{label}</span>
    </button>
  );
};

export default StatusActionButton;