import { api } from '@/lib/api';

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'SYSTEM' | 'APPLICATION' | 'OPPORTUNITY' | 'REVIEW';
    entityId?: string; // ID of the related object (e.g. application ID)
    isRead: boolean;
    createdAt: string;
    data?: any; // Additional payload
}

export interface NotificationListResponse {
    notifications: Notification[];
    unreadCount: number;
}

export const getNotifications = async (limit = 20): Promise<NotificationListResponse> => {
    // API endpoint might return just an array or a wrapper.
    // Adjusting based on standard pattern: usually returns { notifications: [], ... }
    const response = await api.get('/users/me/notifications', { params: { limit } });
    return response.data;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
    await api.post(`/users/me/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
    await api.post('/users/me/notifications/read-all');
};
