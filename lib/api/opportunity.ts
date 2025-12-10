import { http } from '../api';
import { components } from '@/types/api';

export type Opportunity = components['schemas']['domain.Opportunity'];

export interface OpportunitySearchParams {
    page?: number;
    limit?: number;
    city?: string;
    type?: string;
    // ... maps to backend search params
}

export const getOpportunities = async (params?: OpportunitySearchParams): Promise<Opportunity[]> => {
    return http.get<Opportunity[]>('/opportunities', { params });
};

export const getOpportunity = async (id: string): Promise<Opportunity> => {
    return http.get<Opportunity>(`/opportunities/${id}`);
};

export const createOpportunity = async (data: Partial<Opportunity>): Promise<Opportunity> => {
    return http.post<Opportunity>('/opportunities', data);
};

export const updateOpportunity = async (id: string, data: Partial<Opportunity>): Promise<Opportunity> => {
    return http.put<Opportunity>(`/opportunities/${id}`, data);
};

export const deleteOpportunity = async (id: string): Promise<void> => {
    return http.delete<void>(`/opportunities/${id}`);
};

export const bookmarkOpportunity = async (id: string): Promise<void> => {
    return http.post<void>(`/opportunities/${id}/bookmark`, {});
};

export const removeBookmark = async (id: string): Promise<void> => {
    return http.delete<void>(`/opportunities/${id}/bookmark`);
};

export const getBookmarks = async (): Promise<{ opportunities: Opportunity[] }> => {
    return http.get<{ opportunities: Opportunity[] }>('/users/me/bookmarks');
};
