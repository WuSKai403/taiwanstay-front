import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { OpportunityStore, SearchFilters, MapFilters } from './types';

// 初始搜尋過濾條件
const initialSearchFilters: SearchFilters = {
  search: '',
  type: '',
  region: '',
  city: '',
  availableMonths: [],
  sort: 'newest',
  page: 1,
  limit: 10
};

const initialMapFilters: MapFilters = {
  zoom: 7
};

export const useOpportunityStore = create<OpportunityStore>()(
  devtools(
    (set) => ({
      // 初始狀態
      opportunities: [],
      totalCount: 0,
      isLoading: false,
      error: null,
      searchFilters: initialSearchFilters,
      mapFilters: initialMapFilters,
      mapOpportunities: [],
      selectedOpportunityId: null,
      viewMode: 'list',
      isSidebarOpen: true,
      isSearching: false,
      isFiltering: false,

      // 搜尋和過濾動作
      setSearchFilters: (filters) =>
        set((state) => ({
          searchFilters: { ...state.searchFilters, ...filters }
        })),

      resetSearchFilters: () =>
        set(() => ({
          searchFilters: initialSearchFilters
        })),

      setIsSearching: (isSearching) =>
        set(() => ({
          isSearching
        })),

      setIsFiltering: (isFiltering) =>
        set(() => ({
          isFiltering
        })),

      // 地圖相關動作
      setMapFilters: (filters) =>
        set((state) => ({
          mapFilters: { ...state.mapFilters, ...filters }
        })),

      setSelectedOpportunityId: (id) =>
        set(() => ({
          selectedOpportunityId: id
        })),

      // UI 動作
      setViewMode: (mode) =>
        set(() => ({
          viewMode: mode
        })),

      toggleSidebar: () =>
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen
        })),

      // 資料動作
      setOpportunities: (opportunities) =>
        set(() => ({
          opportunities
        })),

      setTotalCount: (count) =>
        set(() => ({
          totalCount: count
        })),

      setLoading: (isLoading) =>
        set(() => ({
          isLoading
        })),

      setError: (error) =>
        set(() => ({
          error
        }))
    }),
    {
      name: 'opportunity-store'
    }
  )
);