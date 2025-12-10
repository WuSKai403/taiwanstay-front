import { http } from '../api';
import { components } from '@/types/api';

export type Application = components['schemas']['domain.Application'];
export type ApplicationPayload = components['schemas']['domain.Application']; // Or specific create payload if distinct

export const createApplication = async (data: ApplicationPayload): Promise<Application> => {
    return http.post<Application>('/applications', data);
};

export const getMyApplications = async (): Promise<Application[]> => {
    return http.get<Application[]>('/applications/me'); // Or /users/me/applications
};

export const getApplications = async (params?: { hostId?: string; opportunityId?: string; status?: string }): Promise<Application[]> => {
    return http.get<Application[]>('/applications', { params });
};

export const getApplication = async (id: string): Promise<Application> => {
    return http.get<Application>(`/applications/${id}`);
};

export const updateApplication = async (id: string, data: Partial<Application>): Promise<Application> => {
    return http.put<Application>(`/applications/${id}`, data);
};

export const cancelApplication = async (id: string): Promise<void> => {
    return http.post<void>(`/applications/${id}/cancel`); // Assuming action endpoint
};

export const updateApplicationStatus = async (id: string, status: string, note?: string): Promise<Application> => {
    return http.put<Application>(`/applications/${id}/status`, { status, note });
};
