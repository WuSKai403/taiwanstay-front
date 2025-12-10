import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyHost, createHost, updateHost } from '@/lib/api/host';
import { Host } from '@/lib/api/host';

const HOST_QUERY_KEY = 'host';

export function useMyHost() {
    return useQuery({
        queryKey: [HOST_QUERY_KEY, 'me'],
        queryFn: getMyHost,
        retry: false,
    });
}

export function useCreateHost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Host) => createHost(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [HOST_QUERY_KEY] });
        },
    });
}

export function useUpdateHost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Host> }) => updateHost(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [HOST_QUERY_KEY] });
        },
    });
}
