import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { getSession, signOut } from 'next-auth/react';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(async (config) => {
    // Check if we are checking for token availability
    if (typeof window !== 'undefined') {
        const session = await getSession();
        if (session?.accessToken) {
            config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Handle 401
api.interceptors.response.use((response) => {
    return response;
}, async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        // Only force signout on client side to avoid infinite loops during SSR if not careful
        if (typeof window !== 'undefined') {
            await signOut({ redirect: true, callbackUrl: '/auth/login' });
        }
    }

    return Promise.reject(error);
});

/**
 * Generic API Helper Methods
 */

export const http = {
    get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        const response = await api.get<T>(url, config);
        return response.data;
    },

    post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        const response = await api.post<T>(url, data, config);
        return response.data;
    },

    put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        const response = await api.put<T>(url, data, config);
        return response.data;
    },

    patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        const response = await api.patch<T>(url, data, config);
        return response.data;
    },

    delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        const response = await api.delete<T>(url, config);
        return response.data;
    }
};

export default api;

