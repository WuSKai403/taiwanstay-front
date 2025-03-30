import { OpportunityStore } from './types';

// 基礎 selectors
export const selectOpportunities = (state: OpportunityStore) => state.opportunities;
export const selectTotalCount = (state: OpportunityStore) => state.totalCount;
export const selectIsLoading = (state: OpportunityStore) => state.isLoading;
export const selectError = (state: OpportunityStore) => state.error;

// 搜尋和過濾 selectors
export const selectSearchFilters = (state: OpportunityStore) => state.searchFilters;
export const selectCurrentPage = (state: OpportunityStore) => state.searchFilters.page;
export const selectPageSize = (state: OpportunityStore) => state.searchFilters.limit;

// 地圖相關 selectors
export const selectMapFilters = (state: OpportunityStore) => state.mapFilters;
export const selectMapOpportunities = (state: OpportunityStore) => state.mapOpportunities;
export const selectSelectedOpportunityId = (state: OpportunityStore) => state.selectedOpportunityId;

// UI selectors
export const selectViewMode = (state: OpportunityStore) => state.viewMode;
export const selectIsSidebarOpen = (state: OpportunityStore) => state.isSidebarOpen;

// 複合 selectors
export const selectPagination = (state: OpportunityStore) => ({
  currentPage: state.searchFilters.page,
  pageSize: state.searchFilters.limit,
  totalCount: state.totalCount,
  totalPages: Math.ceil(state.totalCount / state.searchFilters.limit)
});

export const selectMapBounds = (state: OpportunityStore) => state.mapFilters.bounds;

// 選擇當前選中的機會
export const selectSelectedOpportunity = (state: OpportunityStore) =>
  state.opportunities.find(opp => opp.id === state.selectedOpportunityId) ||
  state.mapOpportunities.find(opp => opp.id === state.selectedOpportunityId);