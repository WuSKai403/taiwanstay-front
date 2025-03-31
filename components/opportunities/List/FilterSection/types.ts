export interface FilterProps {
  disabled?: boolean;
}

export interface TypeFilterProps extends FilterProps {
  selectedType?: string;
  onChange: (value: string) => void;
}

export interface RegionFilterProps extends FilterProps {
  selectedRegion?: string;
  onChange: (value: string) => void;
}

export interface MonthFilterProps extends FilterProps {
  selectedMonths: number[];
  onChange: (value: number[]) => void;
}

export interface SortFilterProps extends FilterProps {
  selectedSort: string;
  onChange: (value: string) => void;
}