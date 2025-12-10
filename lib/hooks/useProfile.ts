import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getMyProfile,
    updateMyProfile,
    Profile
} from '@/lib/api/profile';
import toast from 'react-hot-toast';

const PROFILE_QUERY_KEY = 'profile';

export function useMyProfile() {
    return useQuery({
        queryKey: [PROFILE_QUERY_KEY],
        queryFn: getMyProfile,
        retry: false, // Don't retry if 404/401, mostly
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Profile) => updateMyProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
            toast.success("Profile updated successfully");
        },
        onError: (error: any) => {
            toast.error(`Failed to update profile: ${error.message || 'Unknown error'}`);
        }
    });
}
