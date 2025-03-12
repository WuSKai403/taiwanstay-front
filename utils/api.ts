import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { UserRole } from '../types';

// API 響應類型
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// API 處理函數類型
export type ApiHandler<T = any> = (
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<T>>
) => Promise<void> | void;

// 創建 API 響應
export function createApiResponse<T = any>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): ApiResponse<T> {
  return {
    success,
    ...(data !== undefined && { data }),
    ...(error !== undefined && { error }),
    ...(message !== undefined && { message }),
  };
}

// 身份驗證中間件
export function withAuth(handler: ApiHandler): ApiHandler {
  return async (req, res) => {
    const session = await getSession({ req });

    if (!session) {
      return res.status(401).json(createApiResponse(false, undefined, '未授權'));
    }

    return handler(req, res);
  };
}

// 角色驗證中間件
export function withRole(role: UserRole | UserRole[], handler: ApiHandler): ApiHandler {
  return async (req, res) => {
    const session = await getSession({ req });

    if (!session) {
      return res.status(401).json(createApiResponse(false, undefined, '未授權'));
    }

    const userRole = session.user?.role as UserRole;

    if (Array.isArray(role)) {
      if (!role.includes(userRole)) {
        return res.status(403).json(createApiResponse(false, undefined, '權限不足'));
      }
    } else if (userRole !== role) {
      return res.status(403).json(createApiResponse(false, undefined, '權限不足'));
    }

    return handler(req, res);
  };
}

// 錯誤處理中間件
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error(error);
      return res.status(500).json(
        createApiResponse(false, undefined, '伺服器錯誤', (error as Error).message)
      );
    }
  };
}

// 組合中間件
export function withMiddleware(...middlewares: ((handler: ApiHandler) => ApiHandler)[]) {
  return (handler: ApiHandler): ApiHandler => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}