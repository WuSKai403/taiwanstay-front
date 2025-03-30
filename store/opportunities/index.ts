import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { OpportunityStore, SearchFilters, MapFilters } from './types';

const initialSearchFilters: SearchFilters = {
  page: 1,
  limit: 10,
  sort: 'newest'
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

      // 搜尋和過濾動作
      setSearchFilters: (filters) =>
        set((state) => ({
          searchFilters: { ...state.searchFilters, ...filters }
        })),

      resetSearchFilters: () =>
        set(() => ({
          searchFilters: initialSearchFilters
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