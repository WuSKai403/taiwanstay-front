import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '@/lib/api/notification';

const NOTIFICATION_KEY = 'notifications';

export function useNotifications(limit = 20) {
    return useQuery({
        queryKey: [NOTIFICATION_KEY],
        queryFn: () => getNotifications(limit),
        refetchInterval: 30000, // Poll every 30s
    });
}

export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [NOTIFICATION_KEY] });
        },
    });
}

export function useMarkAllNotificationsAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markAllNotificationsAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [NOTIFICATION_KEY] });
        },
    });
}
