import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getPendingImages,
    reviewImage,
    getPrivateImageUrl,
    getAdminStats,
    getAdminUsers,
    updateUserStatus,
    updateOpportunityStatus
} from '@/lib/api/admin';

export const ADMIN_IMAGES_KEY = 'admin-images';
export const ADMIN_USERS_KEY = 'admin-users';
export const ADMIN_STATS_KEY = 'admin-stats';
export const ADMIN_OPPORTUNITIES_KEY = 'admin-opportunities'; // New key if needed, or invalidate generic opportunities

// Image Hooks
export function usePendingImages() {
    return useQuery({
        queryKey: [ADMIN_IMAGES_KEY, 'pending'],
        queryFn: () => getPendingImages(),
    });
}

export function useReviewImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
            reviewImage(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ADMIN_IMAGES_KEY, 'pending'] });
            queryClient.invalidateQueries({ queryKey: [ADMIN_STATS_KEY] });
        },
    });
}

export function usePrivateImage(id: string) {
    return useQuery({
        queryKey: ['private-image', id],
        queryFn: () => getPrivateImageUrl(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 15,
        retry: 1,
    });
}

// Stats Hook
export function useAdminStats() {
    return useQuery({
        queryKey: [ADMIN_STATS_KEY],
        queryFn: () => getAdminStats(),
    });
}

// User Hooks
export function useAdminUsers(params: { limit?: number; offset?: number; role?: string } = {}) {
    return useQuery({
        queryKey: [ADMIN_USERS_KEY, params],
        queryFn: () => getAdminUsers(params),
    });
}

export function useUpdateUserStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateUserStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] });
        }
    });
}

// Opportunity Hooks
export function useUpdateOpportunityStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateOpportunityStatus(id, status),
        onSuccess: () => {
            // Invalidate global opportunities or admin specific ones
            // The page uses `useOpportunities` which uses 'opportunities' key usually.
            queryClient.invalidateQueries({ queryKey: ['opportunities'] });
        }
    });
}
