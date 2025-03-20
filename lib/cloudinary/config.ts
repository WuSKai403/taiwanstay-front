import { CloudinaryConfig } from './types';

export const cloudinaryConfig: CloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset: {
    public: process.env.NEXT_PUBLIC_CLOUDINARY_PUBLIC_UPLOAD_PRESET || '',
    private: process.env.NEXT_PUBLIC_CLOUDINARY_PRIVATE_UPLOAD_PRESET || '',
  },
  folder: {
    public: 'taiwanstay/public',
    private: 'taiwanstay/private',
  },
};

export const getUploadPreset = (isPrivate: boolean): string => {
  return isPrivate
    ? cloudinaryConfig.uploadPreset.private
    : cloudinaryConfig.uploadPreset.public;
};

export const getUploadFolder = (isPrivate: boolean, subFolder?: string): string => {
  const baseFolder = isPrivate
    ? cloudinaryConfig.folder.private
    : cloudinaryConfig.folder.public;

  return subFolder ? `${baseFolder}/${subFolder}` : baseFolder;
};

export const validateConfig = (): boolean => {
  if (!cloudinaryConfig.cloudName) {
    console.error('Missing Cloudinary cloud name');
    return false;
  }

  if (!cloudinaryConfig.uploadPreset.public || !cloudinaryConfig.uploadPreset.private) {
    console.error('Missing Cloudinary upload presets');
    return false;
  }

  return true;
};

export const getImageUrl = (
  publicId: string,
  config?: {
    isPrivate?: boolean;
    transformation?: string;
  }
): string => {
  const { isPrivate, transformation } = config || {};
  const baseUrl = isPrivate
    ? `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/private`
    : `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload`;

  return transformation
    ? `${baseUrl}/${transformation}/${publicId}`
    : `${baseUrl}/${publicId}`;
};