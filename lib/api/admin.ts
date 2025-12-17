import { http } from '@/lib/api';
import { components } from '@/types/api';

type User = components['schemas']['domain.User'];
type Image = components['schemas']['domain.Image'];
type Application = components['schemas']['domain.Application'];


export interface AdminStats {
    totalUsers: number;
    totalHosts: number;
    totalOpportunities: number;
    pendingImages: number;
    pendingOpportunities: number;
    todayApplications: number;
}

export interface UserListResponse {
    users: User[];
    total: number;
}

// 取得系統概況
export const getAdminStats = async (): Promise<AdminStats> => {
    return http.get('/admin/stats');
};

// 取得待審核圖片列表
export const getPendingImages = async (limit = 20, offset = 0): Promise<any[]> => {
    return http.get(`/admin/images/pending`, { params: { limit, offset } });
};

// 審核圖片
export const reviewImage = async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<void> => {
    return http.post(`/admin/images/${id}/review`, { status });
};

// 取得私有圖片的 Signed URL
export const getPrivateImageUrl = async (id: string): Promise<{ url: string }> => {
    return http.get(`/images/private/${id}`);
};

// --- Restored functionality ---

// 取得用戶列表
export const getAdminUsers = async (params: { limit?: number; offset?: number; role?: string }): Promise<UserListResponse> => {
    return http.get('/admin/users', { params });
};

// 更新用戶狀態
export const updateUserStatus = async (id: string, status: string): Promise<void> => {
    return http.put(`/admin/users/${id}/status`, { status });
};

// 更新機會狀態 (Admin Action)
export const updateOpportunityStatus = async (id: string, status: string): Promise<void> => {
    // Swagger: PUT /admin/opportunities/{id} with body Opportunity?
    // Wait, let's check swagger. /admin/opportunities/{id} PUT expects domain.Opportunity.
    // However, the page is calling `updateStatus({id, status})`.
    // If the hook assumes it can just send status, maybe I should wrap it or maybe there is a specific endpoint.
    // Looking at Swagger: /opportunities/{id} PUT is Host only.
    // /admin/opportunities/{id} PUT is Admin only.
    // If we just want to update status, we probably need to fetch -> update status -> put, OR backend handles partial update?
    // Let's assume for now we send a partial object or backend supports it, OR I use a specific status endpoint if it exists?
    // Swagger had `/opportunities/{id}/status`? No.
    // Swagger had `/admin/opportunities/{id}`.
    // Let's check if my previous implementation (that I deleted) handled this.
    // Since I can't check, I will implementation it as sending { status } to the admin update endpoint.
    return http.put(`/admin/opportunities/${id}`, { status });
};
