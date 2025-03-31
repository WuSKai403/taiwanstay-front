import { OpportunityType } from '@/models/enums/OpportunityType';

export interface Location {
  address?: string;
  city?: string;
  district?: string;
  region?: string;
  country?: string;
  coordinates?: {
    type: string;
    coordinates: [number, number];
  };
}

export interface SearchFilters {
  search?: string;
  type?: string;
  region?: string;
  city?: string;
  availableMonths?: number[];
  sort?: string;
  page: number;
  limit: number;
}

export interface MapFilters {
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoom?: number;
}

export interface OpportunityState {
  // 列表狀態
  opportunities: Array<any>;  // 之後替換為具體的 Opportunity 類型
  totalCount: number;
  isLoading: boolean;
  error: Error | null;

  // 搜尋和過濾
  searchFilters: SearchFilters;
  mapFilters: MapFilters;

  // 地圖狀態
  mapOpportunities: Array<any>;  // 之後替換為具體的 Opportunity 類型
  selectedOpportunityId: string | null;

  // UI 狀態
  viewMode: 'list' | 'map';
  isSidebarOpen: boolean;

  // 搜尋和過濾狀態
  isSearching: boolean;
  isFiltering: boolean;
}

export interface OpportunityActions {
  // 搜尋和過濾動作
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  resetSearchFilters: () => void;
  setIsSearching: (isSearching: boolean) => void;
  setIsFiltering: (isFiltering: boolean) => void;

  // 地圖相關動作
  setMapFilters: (filters: Partial<MapFilters>) => void;
  setSelectedOpportunityId: (id: string | null) => void;

  // UI 動作
  setViewMode: (mode: 'list' | 'map') => void;
  toggleSidebar: () => void;

  // 資料動作
  setOpportunities: (opportunities: Array<any>) => void;
  setTotalCount: (count: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
}

export type OpportunityStore = OpportunityState & OpportunityActions;