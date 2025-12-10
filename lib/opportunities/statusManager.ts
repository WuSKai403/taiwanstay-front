// Enum-like definition matching backend and Zod schema (Single Source of Truth)
export const OpportunityStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  EXPIRED: 'EXPIRED',
  FILLED: 'FILLED',
  REJECTED: 'REJECTED',
  ADMIN_PAUSED: 'ADMIN_PAUSED',
  DELETED: 'DELETED'
} as const;

export type OpportunityStatus = (typeof OpportunityStatus)[keyof typeof OpportunityStatus];


// 狀態與UI映射 (從各組件移入中央配置)
export const statusLabelMap: Record<OpportunityStatus, string> = {
  [OpportunityStatus.DRAFT]: '草稿',
  [OpportunityStatus.PENDING]: '待審核',
  [OpportunityStatus.ACTIVE]: '活躍中',
  [OpportunityStatus.PAUSED]: '已下架',
  [OpportunityStatus.EXPIRED]: '已過期',
  [OpportunityStatus.FILLED]: '已滿額',
  [OpportunityStatus.REJECTED]: '已拒絕',
  [OpportunityStatus.ADMIN_PAUSED]: '管理員暫停',
  [OpportunityStatus.DELETED]: '已刪除',
};

export const statusColorMap: Record<OpportunityStatus, string> = {
  [OpportunityStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [OpportunityStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [OpportunityStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [OpportunityStatus.PAUSED]: 'bg-orange-100 text-orange-800',
  [OpportunityStatus.EXPIRED]: 'bg-red-100 text-red-800',
  [OpportunityStatus.FILLED]: 'bg-purple-100 text-purple-800',
  [OpportunityStatus.REJECTED]: 'bg-red-100 text-red-800',
  [OpportunityStatus.ADMIN_PAUSED]: 'bg-red-100 text-red-800',
  [OpportunityStatus.DELETED]: 'bg-gray-200 text-gray-500',
};

// 狀態描述 (從useOpportunities.ts整合)
export const statusDescriptions: Record<OpportunityStatus, string> = {
  [OpportunityStatus.DRAFT]: '草稿狀態下可編輯所有內容，需編輯完成後送審',
  [OpportunityStatus.PENDING]: '審核中，等待平台審核通過後上架',
  [OpportunityStatus.ACTIVE]: '已上架，對外開放瀏覽與申請',
  [OpportunityStatus.PAUSED]: '暫時不開放申請，但工作機會仍可被瀏覽',
  [OpportunityStatus.EXPIRED]: '已超過設定的結束日期自動下架',
  [OpportunityStatus.FILLED]: '已達到招募人數上限自動暫停',
  [OpportunityStatus.REJECTED]: '未通過平台審核，請查看拒絕原因並修改後重新送審',
  [OpportunityStatus.ADMIN_PAUSED]: '已被管理員暫停，需修改後重新送審',
  [OpportunityStatus.DELETED]: '此機會已被刪除',
};

// 操作按鈕類型定義
export interface StatusAction {
  targetStatus: OpportunityStatus | null; // null 表示僅保存但不變更狀態
  actionLabel: string;
  buttonType: 'primary' | 'secondary' | 'danger';
  description: string;
  isPrimary: boolean;
  needsConfirmation?: boolean;
  confirmMessage?: string;
  needsReason?: boolean;  // 新增：是否需要填寫理由
  reasonTitle?: string;   // 新增：理由輸入框標題
  reasonPlaceholder?: string; // 新增：理由輸入框提示文字
  isHostOnly?: boolean;  // 新增：只有主辦方可見
  isAdminOnly?: boolean;  // 新增：只有管理員可見
}

// 需要填寫理由的狀態轉換配置
export const statusRequiresReason: Partial<Record<OpportunityStatus, OpportunityStatus[]>> = {
  [OpportunityStatus.PENDING]: [OpportunityStatus.REJECTED],
  [OpportunityStatus.ACTIVE]: [OpportunityStatus.PAUSED, OpportunityStatus.ADMIN_PAUSED],
  [OpportunityStatus.PAUSED]: [OpportunityStatus.ACTIVE],
  [OpportunityStatus.ADMIN_PAUSED]: [OpportunityStatus.PENDING, OpportunityStatus.REJECTED]
};

// 每個狀態對應的可用操作
export const statusActions: Record<OpportunityStatus, StatusAction[]> = {
  // 草稿狀態
  [OpportunityStatus.DRAFT]: [
    {
      targetStatus: null,
      actionLabel: '儲存',
      buttonType: 'primary',
      description: '保留修改但維持草稿狀態',
      isPrimary: true
    },
    {
      targetStatus: OpportunityStatus.PENDING,
      actionLabel: '送出審核',
      buttonType: 'secondary',
      description: '送出此機會申請審核',
      isPrimary: false
    }
  ],

  // 待審核狀態
  [OpportunityStatus.PENDING]: [
    {
      targetStatus: null,
      actionLabel: '儲存',
      buttonType: 'primary',
      description: '保留修改但維持待審核狀態',
      isPrimary: true
    },
    {
      targetStatus: OpportunityStatus.DRAFT,
      actionLabel: '撤回審核',
      buttonType: 'secondary',
      description: '撤回審核申請並返回編輯',
      isPrimary: false,
      needsConfirmation: true,
      confirmMessage: '確定要撤回審核嗎？此操作將取消當前的審核申請。'
    },
    {
      targetStatus: OpportunityStatus.REJECTED,
      actionLabel: '拒絕',
      buttonType: 'danger',
      description: '拒絕此機會上架申請',
      isPrimary: false,
      needsReason: true,
      reasonTitle: '拒絕原因',
      reasonPlaceholder: '請說明拒絕原因，讓主辦方了解需要改進的地方...'
    }
  ],

  // 已拒絕狀態
  [OpportunityStatus.REJECTED]: [
    {
      targetStatus: null,
      actionLabel: '儲存',
      buttonType: 'secondary',
      description: '保留修改但維持拒絕狀態',
      isPrimary: false
    },
    {
      targetStatus: OpportunityStatus.PENDING,
      actionLabel: '重新送審',
      buttonType: 'primary',
      description: '重新送出此機會申請審核',
      isPrimary: true
    }
  ],

  // 活躍中狀態 (儲存即發布)
  [OpportunityStatus.ACTIVE]: [
    {
      targetStatus: OpportunityStatus.ACTIVE,
      actionLabel: '更新發布',
      buttonType: 'primary',
      description: '儲存並更新已發布的機會內容',
      isPrimary: true
    },
    {
      targetStatus: OpportunityStatus.PAUSED,
      actionLabel: '暫停刊登',
      buttonType: 'danger',
      description: '暫時停止此機會的顯示與申請',
      isPrimary: false,
      needsConfirmation: true,
      confirmMessage: '確定要暫停此機會嗎？暫停後將不再接受新申請。',
      needsReason: true,
      reasonTitle: '暫停原因',
      reasonPlaceholder: '請說明暫停原因，此說明將顯示給使用者...',
      isHostOnly: true
    },
    {
      targetStatus: OpportunityStatus.ADMIN_PAUSED,
      actionLabel: '管理員暫停',
      buttonType: 'danger',
      description: '由管理員暫停此機會',
      isPrimary: false,
      needsReason: true,
      reasonTitle: '管理員暫停原因',
      reasonPlaceholder: '請說明暫停原因，此說明將顯示給主辦方...',
      isAdminOnly: true
    }
  ],

  // 已下架狀態
  [OpportunityStatus.PAUSED]: [
    {
      targetStatus: null,
      actionLabel: '儲存',
      buttonType: 'secondary',
      description: '保留修改但維持暫停狀態',
      isPrimary: false
    },
    {
      targetStatus: OpportunityStatus.ACTIVE,
      actionLabel: '重新開放',
      buttonType: 'primary',
      description: '重新開放此機會接受申請',
      isPrimary: true,
      needsReason: true,
      reasonTitle: '重新開放說明',
      reasonPlaceholder: '請說明重新開放的原因或改善措施...'
    }
  ],

  // 已過期狀態
  [OpportunityStatus.EXPIRED]: [
    {
      targetStatus: null,
      actionLabel: '儲存',
      buttonType: 'secondary',
      description: '保留修改但維持過期狀態',
      isPrimary: false
    },
    {
      targetStatus: OpportunityStatus.ACTIVE,
      actionLabel: '重新開放',
      buttonType: 'primary',
      description: '更新日期並重新開放申請',
      isPrimary: true
    },
    {
      targetStatus: OpportunityStatus.PAUSED,
      actionLabel: '下架機會',
      buttonType: 'danger',
      description: '永久下架此機會',
      isPrimary: false,
      needsConfirmation: true,
      confirmMessage: '確定要下架此機會嗎？下架後將不再對外顯示。'
    }
  ],

  // 已滿額狀態
  [OpportunityStatus.FILLED]: [
    {
      targetStatus: OpportunityStatus.ACTIVE,
      actionLabel: '增加名額',
      buttonType: 'primary',
      description: '增加名額並重新開放申請',
      isPrimary: true
    },
    {
      targetStatus: OpportunityStatus.PAUSED,
      actionLabel: '暫停刊登',
      buttonType: 'secondary',
      description: '暫停此機會的顯示與申請',
      isPrimary: false
    }
  ],

  // 新增 ADMIN_PAUSED 狀態的操作
  [OpportunityStatus.ADMIN_PAUSED]: [
    {
      targetStatus: OpportunityStatus.PENDING,
      actionLabel: '重新送審',
      buttonType: 'primary',
      description: '修改後重新送出審核',
      isPrimary: true,
      needsReason: true,
      reasonTitle: '改善說明',
      reasonPlaceholder: '請說明已改善的內容...'
    },
    {
      targetStatus: OpportunityStatus.REJECTED,
      actionLabel: '拒絕機會',
      buttonType: 'danger',
      description: '拒絕此機會上架申請',
      isPrimary: false,
      needsReason: true,
      reasonTitle: '拒絕原因',
      reasonPlaceholder: '請說明拒絕原因，讓主辦方了解需要改進的地方...',
      isAdminOnly: true
    }
  ],
  [OpportunityStatus.DELETED]: []
};

// 機會狀態流轉規則
export const statusTransitions: Record<OpportunityStatus, {
  canEdit: boolean | 'limited';
  possibleNextStates: OpportunityStatus[];
  requiredAction?: string;
}> = {
  [OpportunityStatus.DRAFT]: {
    canEdit: true,
    possibleNextStates: [OpportunityStatus.PENDING],
    requiredAction: '送審',
  },
  [OpportunityStatus.PENDING]: {
    canEdit: false,
    possibleNextStates: [OpportunityStatus.DRAFT, OpportunityStatus.ACTIVE, OpportunityStatus.REJECTED],
    requiredAction: '等待審核',
  },
  [OpportunityStatus.ACTIVE]: {
    canEdit: 'limited',
    possibleNextStates: [
      OpportunityStatus.PAUSED,
      OpportunityStatus.ADMIN_PAUSED,
      OpportunityStatus.FILLED,
      OpportunityStatus.EXPIRED
    ],
  },
  [OpportunityStatus.PAUSED]: {
    canEdit: 'limited',
    possibleNextStates: [OpportunityStatus.ACTIVE],
  },
  [OpportunityStatus.EXPIRED]: {
    canEdit: 'limited',
    possibleNextStates: [OpportunityStatus.DRAFT, OpportunityStatus.ACTIVE, OpportunityStatus.PAUSED],
  },
  [OpportunityStatus.FILLED]: {
    canEdit: 'limited',
    possibleNextStates: [OpportunityStatus.ACTIVE, OpportunityStatus.PAUSED],
  },
  [OpportunityStatus.REJECTED]: {
    canEdit: true,
    possibleNextStates: [OpportunityStatus.PENDING],
  },
  [OpportunityStatus.ADMIN_PAUSED]: {
    canEdit: 'limited',
    possibleNextStates: [OpportunityStatus.PENDING, OpportunityStatus.REJECTED],
    requiredAction: '重新送審',
  },
  [OpportunityStatus.DELETED]: {
    canEdit: false,
    possibleNextStates: [],
  }
};

// 判斷特定狀態是否允許儲存操作
export const canSave = (status: OpportunityStatus): boolean => {
  return statusActions[status].some(action => action.targetStatus === null);
};

// 判斷特定狀態是否允許編輯 (整合自useOpportunities.ts)
export function canEditOpportunity(status: OpportunityStatus): boolean | 'limited' {
  const editStatus = statusTransitions[status]?.canEdit;
  if (editStatus === 'limited') {
    return 'limited';
  }
  return !!editStatus;
}

// 獲取特定狀態可變更的下一個狀態
export const getNextAllowedStates = (status: OpportunityStatus): OpportunityStatus[] => {
  return statusTransitions[status].possibleNextStates;
};

// 檢查狀態轉換是否有效 (整合自useOpportunities.ts)
export function isValidStatusTransition(currentStatus: OpportunityStatus, newStatus: OpportunityStatus): boolean {
  return getNextAllowedStates(currentStatus).includes(newStatus);
}

// 獲取狀態變更消息 (整合自useOpportunities.ts)
export function getStatusUpdateMessage(newStatus: OpportunityStatus): string {
  switch (newStatus) {
    case OpportunityStatus.DRAFT:
      return '已將機會退回草稿狀態，你可以繼續編輯';
    case OpportunityStatus.PENDING:
      return '已送出審核，請等待管理員審核';
    case OpportunityStatus.ACTIVE:
      return '機會已成功上線，開始接受申請';
    case OpportunityStatus.PAUSED:
      return '已暫停機會的顯示與申請';
    case OpportunityStatus.EXPIRED:
      return '機會已標記為過期';
    case OpportunityStatus.FILLED:
      return '機會已標記為名額已滿';
    case OpportunityStatus.REJECTED:
      return '機會已標記為拒絕，host可重新送審';
    case OpportunityStatus.ADMIN_PAUSED:
      return '機會已被管理員暫停，請洽後台管理員重新送審';
    default:
      return '狀態已更新';
  }
}

// 獲取該狀態下的主要操作按鈕
export const getPrimaryAction = (status: OpportunityStatus): StatusAction | undefined => {
  return statusActions[status].find(action => action.isPrimary);
};

// 獲取該狀態下的次要操作按鈕
export const getSecondaryActions = (status: OpportunityStatus): StatusAction[] => {
  return statusActions[status].filter(action => !action.isPrimary);
};

// 檢查操作是否需要確認
export const needsConfirmation = (status: OpportunityStatus, targetStatus: OpportunityStatus | null): boolean => {
  const action = statusActions[status].find(a => a.targetStatus === targetStatus);
  return !!action?.needsConfirmation;
};

// 獲取確認消息
export const getConfirmationMessage = (status: OpportunityStatus, targetStatus: OpportunityStatus | null): string => {
  const action = statusActions[status].find(a => a.targetStatus === targetStatus);
  return action?.confirmMessage || '確定要變更狀態嗎？';
};

// 後端狀態轉換檢查 (API 使用)
export const allowedStateTransitions: Record<OpportunityStatus, OpportunityStatus[]> = {
  [OpportunityStatus.DRAFT]: [OpportunityStatus.PENDING],
  [OpportunityStatus.PENDING]: [OpportunityStatus.DRAFT, OpportunityStatus.ACTIVE, OpportunityStatus.REJECTED],
  [OpportunityStatus.ACTIVE]: [OpportunityStatus.PAUSED, OpportunityStatus.ADMIN_PAUSED],
  [OpportunityStatus.PAUSED]: [OpportunityStatus.ACTIVE],
  [OpportunityStatus.EXPIRED]: [OpportunityStatus.ACTIVE, OpportunityStatus.PAUSED],
  [OpportunityStatus.FILLED]: [OpportunityStatus.ACTIVE, OpportunityStatus.PAUSED],
  [OpportunityStatus.REJECTED]: [OpportunityStatus.PENDING],
  [OpportunityStatus.ADMIN_PAUSED]: [OpportunityStatus.PENDING, OpportunityStatus.REJECTED],
  [OpportunityStatus.DELETED]: []
};

// 檢查狀態轉換是否允許 (API 使用)
export const isTransitionAllowed = (currentStatus: OpportunityStatus, newStatus: OpportunityStatus): boolean => {
  return allowedStateTransitions[currentStatus]?.includes(newStatus) || false;
};

// 檢查狀態轉換是否需要理由
export const requiresReason = (currentStatus: OpportunityStatus, newStatus: OpportunityStatus): boolean => {
  return statusRequiresReason[currentStatus]?.includes(newStatus) || false;
};

// 獲取狀態轉換的理由設定
export const getReasonConfig = (currentStatus: OpportunityStatus, targetStatus: OpportunityStatus | null): {
  needsReason: boolean;
  reasonTitle?: string;
  reasonPlaceholder?: string;
} => {
  const action = statusActions[currentStatus].find(a => a.targetStatus === targetStatus);
  return {
    needsReason: !!action?.needsReason,
    reasonTitle: action?.reasonTitle,
    reasonPlaceholder: action?.reasonPlaceholder
  };
};