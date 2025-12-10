import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAdminStats,
    getAdminUsers,
    updateUserStatus,
    getPendingImages,
    reviewImage,
    updateOpportunityStatus
} from '@/lib/api/admin';

export const ADMIN_KEYS = {
    all: ['admin'] as const,
    stats: () => [...ADMIN_KEYS.all, 'stats'] as const,
    users: (filters: Record<string, any>) => [...ADMIN_KEYS.all, 'users', filters] as const,
    images: (filters: Record<string, any>) => [...ADMIN_KEYS.all, 'images', filters] as const,
};

// Stats
export function useAdminStats() {
    return useQuery({
        queryKey: ADMIN_KEYS.stats(),
        queryFn: getAdminStats,
    });
}

// Users
export function useAdminUsers(params: { limit?: number; offset?: number; role?: string } = {}) {
    return useQuery({
        queryKey: ADMIN_KEYS.users(params),
        queryFn: () => getAdminUsers(params),
    });
}

export function useUpdateUserStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateUserStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.users({}) });
            queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats() });
        },
    });
}

// Images
export function usePendingImages(params: { limit?: number; offset?: number } = {}) {
    return useQuery({
        queryKey: ADMIN_KEYS.images(params),
        queryFn: () => getPendingImages(params),
    });
}

export function useReviewImage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => reviewImage(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.images({}) });
            queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats() });
        },
    });
}

// Opportunities
export function useUpdateOpportunityStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateOpportunityStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opportunities'] }); // Invalidate public/host list
            queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats() });
        },
    });
}
