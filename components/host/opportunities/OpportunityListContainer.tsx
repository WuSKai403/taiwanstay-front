import React from 'react';
import { useRouter } from 'next/router';
import { useOpportunities, useOpportunityStatusActions } from '@/lib/hooks/useOpportunities';
import OpportunityList from './OpportunityList';
import { OpportunityStatus } from '@/models/enums';

const OpportunityListContainer: React.FC = () => {
  const router = useRouter();
  const { hostId } = router.query;
  const hostIdString = typeof hostId === 'string' ? hostId : '';

  // 獲取機會列表
  const { data, isLoading, error } = useOpportunities({
    hostId: hostIdString,
  });

  // 獲取狀態更新動作
  const { onUpdateStatus } = useOpportunityStatusActions();

  // 處理編輯機會
  const handleEdit = (id: string) => {
    router.push(`/hosts/${hostId}/opportunities/${id}/edit`);
  };

  // 處理查看申請
  const handleViewApplications = (id: string) => {
    router.push(`/hosts/${hostId}/opportunities/${id}/applications`);
  };

  // 處理查看機會
  const handleView = (id: string) => {
    router.push(`/opportunities/${id}`);
  };

  // 處理狀態更新
  const handleUpdateStatus = async (id: string, status: OpportunityStatus, currentStatus: OpportunityStatus) => {
    try {
      await onUpdateStatus(id, status, currentStatus);
      return true;
    } catch (error) {
      console.error('更新狀態失敗:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-36 bg-gray-200 rounded mb-4"></div>
          <div className="h-36 bg-gray-200 rounded mb-4"></div>
          <div className="h-36 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-red-500">載入機會列表時發生錯誤</p>
        <p className="text-gray-500">{error instanceof Error ? error.message : '未知錯誤'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          重新載入
        </button>
      </div>
    );
  }

  const opportunities = data?.opportunities || [];

  if (opportunities.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">尚未建立任何工作機會</h3>
        <p className="mt-1 text-sm text-gray-500">點擊下方按鈕開始建立您的第一個工作機會</p>
        <div className="mt-6">
          <button
            onClick={() => router.push(`/hosts/${hostId}/opportunities/new/edit`)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            新增工作機會
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">工作機會列表</h2>
        <button
          onClick={() => router.push(`/hosts/${hostId}/opportunities/new/edit`)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          新增機會
        </button>
      </div>

      <OpportunityList
        opportunities={opportunities}
        onEdit={handleEdit}
        onView={handleView}
        onViewApplications={handleViewApplications}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default OpportunityListContainer;