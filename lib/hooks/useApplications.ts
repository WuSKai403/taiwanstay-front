import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createApplication,
    getMyApplications,
    getApplications,
    cancelApplication,
    updateApplicationStatus,
    ApplicationPayload
} from '@/lib/api/application';

const APPLICATIONS_QUERY_KEY = 'applications';

export function useMyApplications() {
    return useQuery({
        queryKey: [APPLICATIONS_QUERY_KEY, 'me'],
        queryFn: getMyApplications,
    });
}

export function useApplications(params?: { hostId?: string; opportunityId?: string; status?: string }) {
    return useQuery({
        queryKey: [APPLICATIONS_QUERY_KEY, params],
        queryFn: () => getApplications(params),
        enabled: !!(params?.hostId || params?.opportunityId), // Only fetch if params provided
    });
}

export function useCreateApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ApplicationPayload) => createApplication(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [APPLICATIONS_QUERY_KEY] });
        },
    });
}

export function useCancelApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => cancelApplication(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [APPLICATIONS_QUERY_KEY] });
        },
    });
}

export function useUpdateApplicationStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
            updateApplicationStatus(id, status, note),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [APPLICATIONS_QUERY_KEY] });
        },
    });
}
