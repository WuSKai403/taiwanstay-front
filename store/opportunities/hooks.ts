import { useCallback } from 'react';
import { useOpportunityStore } from './index';
import { SearchFilters, MapFilters } from './types';
import * as selectors from './selectors';

// 搜尋和過濾 hooks
export const useSearchFilters = () => {
  const filters = useOpportunityStore(selectors.selectSearchFilters);
  const setSearchFilters = useOpportunityStore(state => state.setSearchFilters);
  const resetSearchFilters = useOpportunityStore(state => state.resetSearchFilters);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setSearchFilters({ ...newFilters, page: 1 }); // 更新過濾條件時重置頁碼
  }, [setSearchFilters]);

  return {
    filters,
    updateFilters,
    resetSearchFilters
  };
};

// 分頁 hooks
export const usePagination = () => {
  const pagination = useOpportunityStore(selectors.selectPagination);
  const setSearchFilters = useOpportunityStore(state => state.setSearchFilters);

  const setPage = useCallback((page: number) => {
    setSearchFilters({ page });
  }, [setSearchFilters]);

  return {
    ...pagination,
    setPage
  };
};

// 地圖相關 hooks
export const useMapState = () => {
  const mapFilters = useOpportunityStore(selectors.selectMapFilters);
  const setMapFilters = useOpportunityStore(state => state.setMapFilters);
  const mapOpportunities = useOpportunityStore(selectors.selectMapOpportunities);
  const selectedOpportunityId = useOpportunityStore(selectors.selectSelectedOpportunityId);
  const setSelectedOpportunityId = useOpportunityStore(state => state.setSelectedOpportunityId);

  const updateMapFilters = useCallback((newFilters: Partial<MapFilters>) => {
    setMapFilters(newFilters);
  }, [setMapFilters]);

  return {
    mapFilters,
    updateMapFilters,
    mapOpportunities,
    selectedOpportunityId,
    setSelectedOpportunityId
  };
};

// UI 狀態 hooks
export const useUIState = () => {
  const viewMode = useOpportunityStore(selectors.selectViewMode);
  const setViewMode = useOpportunityStore(state => state.setViewMode);
  const isSidebarOpen = useOpportunityStore(selectors.selectIsSidebarOpen);
  const toggleSidebar = useOpportunityStore(state => state.toggleSidebar);

  return {
    viewMode,
    setViewMode,
    isSidebarOpen,
    toggleSidebar
  };
};

// 資料載入狀態 hooks
export const useLoadingState = () => {
  const isLoading = useOpportunityStore(selectors.selectIsLoading);
  const error = useOpportunityStore(selectors.selectError);
  const setLoading = useOpportunityStore(state => state.setLoading);
  const setError = useOpportunityStore(state => state.setError);

  return {
    isLoading,
    error,
    setLoading,
    setError
  };
};