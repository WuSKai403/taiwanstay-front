import { http } from '../api';
import { components } from '@/types/api';

export type User = components['schemas']['domain.User'];
export type UserRole = components['schemas']['domain.UserRole'];

/**
 * Get current user profile
 */
export const getMe = async (): Promise<User> => {
  return http.get<User>('/users/me');
};

/**
 * Get user by ID (Public profile)
 */
export const getUser = async (id: string): Promise<User> => {
  return http.get<User>(`/users/${id}`);
};

/**
 * Update current user profile
 */
export const updateMe = async (data: Partial<User>): Promise<User> => {
  return http.put<User>('/users/me', data);
};

// Legacy support (to be removed/refactored)
// export const searchUser = ...
