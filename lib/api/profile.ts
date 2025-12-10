import { http } from '../api';
import { components } from '@/types/api';

export type Profile = components['schemas']['domain.Profile'];

/**
 * Get current user's profile
 * (Usually part of user, but having a dedicated getter is useful if endpoint exists)
 */
export const getMyProfile = async (): Promise<Profile> => {
    // If backend doesn't have /users/me/profile, we might need to fetch /users/me and extract profile
    // For now assuming /users/me/profile exists or we rely on User service.
    // Let's assume a dedicated endpoint for granular control, or fallback to User.
    return http.get<Profile>('/users/me/profile');
};

/**
 * Update current user's profile
 */
export const updateMyProfile = async (data: Profile): Promise<Profile> => {
    return http.put<Profile>('/users/me/profile', data);
};
