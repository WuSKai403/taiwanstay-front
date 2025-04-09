import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// 建立API客戶端實例
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 - 增加認證信息
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 如果在客戶端環境下，可以從localStorage中獲取token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 響應攔截器 - 標準化響應，處理錯誤
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // 處理特定錯誤
    if (error.response) {
      // 伺服器回應了錯誤
      console.error('API錯誤:', error.response.data);

      // 處理未授權錯誤
      if (error.response.status === 401) {
        // 可以在這裡處理登出邏輯
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          // 如果需要，可以重定向到登入頁面
          // window.location.href = '/auth/login';
        }
      }
    } else if (error.request) {
      // 請求已發送但沒有收到響應
      console.error('未收到API響應:', error.request);
    } else {
      // 發送請求時出錯
      console.error('API請求錯誤:', error.message);
    }

    return Promise.reject(error);
  }
);

// API請求功能

// 通用GET請求
export const fetchData = async <T = any>(url: string, params = {}): Promise<T> => {
  try {
    const response = await apiClient.get<T>(url, { params });
    return response.data;
  } catch (error) {
    console.error(`獲取數據失敗 (${url}):`, error);
    throw error;
  }
};

// 通用POST請求
export const postData = async <T = any>(url: string, data = {}, config = {}): Promise<T> => {
  try {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  } catch (error) {
    console.error(`發送數據失敗 (${url}):`, error);
    throw error;
  }
};

// 通用PUT請求
export const updateData = async <T = any>(url: string, data = {}): Promise<T> => {
  try {
    const response = await apiClient.put<T>(url, data);
    return response.data;
  } catch (error) {
    console.error(`更新數據失敗 (${url}):`, error);
    throw error;
  }
};

// 通用DELETE請求
export const deleteData = async <T = any>(url: string): Promise<T> => {
  try {
    const response = await apiClient.delete<T>(url);
    return response.data;
  } catch (error) {
    console.error(`刪除數據失敗 (${url}):`, error);
    throw error;
  }
};

export default apiClient;