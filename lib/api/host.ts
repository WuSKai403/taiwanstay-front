import axios from 'axios';

// 主人資料類型定義
export interface HostData {
  _id: string;
  name: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  website?: string;
  status: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// 更新主人資料的表單類型
export interface HostUpdateForm {
  name: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  website?: string;
}

/**
 * 獲取指定ID的主人資料
 * @param hostId 主人ID
 * @returns 主人資料
 */
export async function getHostById(hostId: string): Promise<HostData> {
  try {
    const response = await axios.get(`/api/hosts/${hostId}`);
    if (response.data.success) {
      return response.data.host;
    } else {
      throw new Error(response.data.message || '無法獲取主人資料');
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '獲取主人資料時發生錯誤');
  }
}

/**
 * 更新主人資料
 * @param hostId 主人ID
 * @param data 更新的資料
 * @returns 更新後的主人資料
 */
export async function updateHost(hostId: string, data: HostUpdateForm): Promise<HostData> {
  try {
    const response = await axios.put(`/api/hosts/${hostId}`, data);
    if (response.data.success) {
      return response.data.host;
    } else {
      throw new Error(response.data.message || '無法更新主人資料');
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '更新主人資料時發生錯誤');
  }
}

/**
 * 更新主人設定 (不需要進入編輯狀態)
 * @param hostId 主人ID
 * @param data 更新的設定資料
 * @returns 更新後的主人設定資料
 */
export async function updateHostSettings(hostId: string, data: HostUpdateForm): Promise<HostData> {
  try {
    const response = await axios.put(`/api/hosts/${hostId}/settings`, data);
    if (response.data.success) {
      return response.data.host;
    } else {
      throw new Error(response.data.message || '無法更新主人設定');
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '更新主人設定時發生錯誤');
  }
}