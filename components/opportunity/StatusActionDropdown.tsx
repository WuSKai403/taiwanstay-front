import { OpportunityStatus } from '@/models/enums';
import { UserRole } from '@/models/enums/UserRole';
import {
  statusTransitions,
  statusActions,
  StatusAction,
  requiresReason,
  getReasonConfig
} from '@/lib/opportunities/statusManager';
import { useState } from 'react';
import ReasonDialog from '@/components/common/ReasonDialog';

interface StatusActionDropdownProps {
  currentStatus: OpportunityStatus;
  onStatusUpdate: (newStatus: OpportunityStatus, reason?: string) => void;
  showSaveAction?: boolean; // 控制是否顯示儲存操作
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  userRole?: UserRole; // 新增：用戶角色
}

const StatusActionDropdown: React.FC<StatusActionDropdownProps> = ({
  currentStatus,
  onStatusUpdate,
  showSaveAction = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  userRole = UserRole.HOST // 預設為主辦方角色
}) => {
  const [reasonDialog, setReasonDialog] = useState<{
    isOpen: boolean;
    newStatus: OpportunityStatus;
    config: ReturnType<typeof getReasonConfig>;
  } | null>(null);

  // 獲取可用的狀態操作
  const getAvailableActions = (status: OpportunityStatus): StatusAction[] => {
    // 從 statusTransitions 中獲取可能的下一個狀態
    const possibleNextStates = statusTransitions[status]?.possibleNextStates || [];

    // 從 statusActions 中獲取當前狀態的所有操作
    const allActions = statusActions[status] || [];

    // 過濾出有效的狀態轉換操作
    return allActions.filter(action => {
      // 如果不顯示儲存操作，則過濾掉 targetStatus 為 null 的操作
      if (!showSaveAction && action.targetStatus === null) {
        return false;
      }

      // 根據用戶角色過濾操作
      if (action.isHostOnly && userRole !== UserRole.HOST) {
        return false;
      }
      if (action.isAdminOnly && userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
        return false;
      }

      // 確保目標狀態在允許的轉換列表中
      return action.targetStatus === null || possibleNextStates.includes(action.targetStatus);
    });
  };

  // 處理狀態更新
  const handleStatusUpdate = (newStatus: OpportunityStatus | null) => {
    if (newStatus === null) {
      // 如果是儲存操作，直接調用回調
      onStatusUpdate(currentStatus);
      return;
    }

    const config = getReasonConfig(currentStatus, newStatus);
    if (requiresReason(currentStatus, newStatus)) {
      setReasonDialog({
        isOpen: true,
        newStatus,
        config
      });
    } else {
      onStatusUpdate(newStatus);
    }
  };

  const availableActions = getAvailableActions(currentStatus);

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        <button
          type="button"
          className={`px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200 transition-colors inline-flex items-center ${buttonClassName}`}
        >
          狀態操作
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <div className={`absolute left-0 z-50 mt-1 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-100 ${menuClassName}`}>
          <div className="bg-white border border-gray-200 rounded-md shadow-lg p-1 ring-1 ring-black ring-opacity-5">
            {availableActions.map(action => (
              <button
                key={action.actionLabel}
                onClick={() => handleStatusUpdate(action.targetStatus)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded ${
                  action.buttonType === 'danger' ? 'text-red-600 hover:bg-red-50' :
                  action.buttonType === 'primary' ? 'text-blue-600 hover:bg-blue-50' :
                  'text-gray-700'
                }`}
              >
                {action.actionLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 理由對話框 */}
      {reasonDialog && (
        <ReasonDialog
          isOpen={reasonDialog.isOpen}
          onClose={() => setReasonDialog(null)}
          onConfirm={(reason) => {
            onStatusUpdate(reasonDialog.newStatus, reason);
            setReasonDialog(null);
          }}
          title={reasonDialog.config.reasonTitle || '請輸入原因'}
          placeholder={reasonDialog.config.reasonPlaceholder}
          isRequired={true}
        />
      )}
    </>
  );
};

export default StatusActionDropdown;