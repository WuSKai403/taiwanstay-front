import { api } from './index';
import { components } from '@/types/api';

export type User = components['schemas']['domain.User'];
export type Image = components['schemas']['domain.Image'];
export type Opportunity = components['schemas']['domain.Opportunity'];

export interface AdminStats {
    totalUsers: number;
    totalHosts: number;
    totalOpportunities: number;
    pendingImages: number;
    pendingOpportunities: number;
    // Add other stats as needed based on actual response
}

export interface UserListResponse {
    users: User[];
    total: number;
}

export interface PendingImagesResponse {
    images: Image[];
    total: number;
}

// Stats
export const getAdminStats = async (): Promise<AdminStats> => {
    const response = await api.get('/admin/stats');
    return response.data;
};

// Users
export const getAdminUsers = async (params: { limit?: number; offset?: number; role?: string }): Promise<UserListResponse> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
};

export const updateUserStatus = async (id: string, status: string): Promise<void> => {
    await api.put(`/admin/users/${id}/status`, { status });
};

// Images
export const getPendingImages = async (params: { limit?: number; offset?: number }): Promise<PendingImagesResponse> => {
    const response = await api.get('/admin/images/pending', { params });
    return response.data;
};

export const reviewImage = async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<void> => {
    await api.post(`/admin/images/${id}/review`, { status });
};

// Opportunities (Admin)
export const updateOpportunityStatus = async (id: string, status: string): Promise<void> => {
    // The endpoint is generic update, assuming payload for status
    await api.put(`/admin/opportunities/${id}`, { status });
};
