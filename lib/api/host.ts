import { http } from '../api';
import { components } from '@/types/api';

export type Host = components['schemas']['domain.Host'];

export const getHost = async (hostId: string): Promise<Host> => {
  return http.get<Host>(`/hosts/${hostId}`);
};

export const updateHost = async (hostId: string, data: Partial<Host>): Promise<Host> => {
  return http.put<Host>(`/hosts/${hostId}`, data);
};

export const createHost = async (data: Partial<Host>): Promise<Host> => {
  return http.post<Host>('/hosts', data);
};

export const getMyHost = async (): Promise<Host> => {
  return http.get<Host>('/hosts/me');
};