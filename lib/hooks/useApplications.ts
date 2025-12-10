import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createApplication,
    getMyApplications,
    cancelApplication,
    ApplicationPayload
} from '@/lib/api/application';

const APPLICATIONS_QUERY_KEY = 'applications';

export function useMyApplications() {
    return useQuery({
        queryKey: [APPLICATIONS_QUERY_KEY],
        queryFn: getMyApplications,
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
