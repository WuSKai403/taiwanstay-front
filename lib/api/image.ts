import { http } from '../api';
import { components } from '@/types/api';

export type Image = components['schemas']['domain.Image'];

export const uploadImage = async (file: File): Promise<Image> => {
    const formData = new FormData();
    formData.append('image', file);

    return http.post<Image>('/images', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
