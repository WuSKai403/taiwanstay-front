export interface User {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  phone?: string | null;
  emergencyContact?: string | null;
  aboutMe?: string | null;
  role?: 'user' | 'host' | 'admin' | null;
  organizationId?: string | null;
  hostId?: string | null;
}

export interface DBUser {
  _id: string;
  email: string;
  name: string;
  image?: string;
  phone?: string;
  emergencyContact?: string;
  aboutMe?: string;
  role: 'user' | 'host' | 'admin';
  organizationId?: string;
  hostId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  emergencyContact?: string;
  aboutMe?: string;
}