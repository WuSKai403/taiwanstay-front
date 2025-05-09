/**
 * API 路由中間件 (authMiddleware.ts)
 *
 * 權責說明:
 * 1. API層級的權限控制：更細粒度的資源訪問權限檢查
 * 2. 資源擁有權驗證：確保用戶只能訪問自己的資源（主人、機會等）
 * 3. 角色權限校驗：管理員、主人等角色的細緻權限控制
 *
 * 與全局路由中間件 (middleware.ts) 的區別:
 * - 本中間件處理API請求，middleware.ts處理頁面請求
 * - 本中間件返回JSON錯誤響應，middleware.ts負責頁面重定向
 * - 本中間件進行細粒度資源權限檢查，middleware.ts進行基本路由保護
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { UserRole } from '@/models/enums/UserRole';
import User from '@/models/User';
import Host from '@/models/Host';
import { connectToDatabase } from '@/lib/mongodb';
import { isAdmin, isHost } from '@/utils/roleUtils';
import mongoose from 'mongoose';

// 中間件類型定義
type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
type MiddlewareFunction = (handler: NextApiHandler) => NextApiHandler;

/**
 * 需要用戶登入的中間件
 */
export const requireAuth: MiddlewareFunction = (handler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // 獲取用戶會話
    const session = await getSession({ req });

    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: '未授權，請先登入' });
    }

    // 授權通過，繼續執行處理程序
    return handler(req, res);
  };
};

/**
 * 檢查是否為管理員的中間件
 */
export const requireAdmin: MiddlewareFunction = (handler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // 獲取用戶會話
    const session = await getSession({ req });

    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: '未授權，請先登入' });
    }

    try {
      await connectToDatabase();
      const user = await User.findById(session.user.id);

      if (!user || !isAdmin(user)) {
        return res.status(403).json({ success: false, message: '需要管理員權限' });
      }

      // 授權通過，繼續執行處理程序
      return handler(req, res);
    } catch (error) {
      console.error('驗證管理員權限時出錯:', error);
      return res.status(500).json({ success: false, message: '服務器錯誤' });
    }
  };
};

/**
 * 檢查是否為主人擁有者或管理員
 * @param hostIdExtractor 從請求中提取主人ID的函數
 */
export const requireHostOwnerOrAdmin = (
  hostIdExtractor: (req: NextApiRequest) => string | undefined
): MiddlewareFunction => {
  return (handler) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      // 獲取用戶會話
      const session = await getSession({ req });

      if (!session || !session.user) {
        return res.status(401).json({ success: false, message: '未授權，請先登入' });
      }

      try {
        await connectToDatabase();

        // 從請求中獲取主人ID
        const hostId = hostIdExtractor(req);

        if (!hostId) {
          return res.status(400).json({ success: false, message: '無效的主人ID' });
        }

        // 確保用戶ID存在
        const userId = session.user.id;
        if (!userId) {
          return res.status(401).json({ success: false, message: '無效的用戶ID' });
        }

        // 檢查訪問權限
        const hasAccess = await checkHostAccess(userId, hostId);

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: '沒有權限訪問，需要主人擁有者或管理員權限'
          });
        }

        // 授權通過，繼續執行處理程序
        return handler(req, res);
      } catch (error) {
        console.error('驗證主人擁有者權限時出錯:', error);
        return res.status(500).json({ success: false, message: '服務器錯誤' });
      }
    };
  };
};

/**
 * 檢查對機會的權限（機會擁有者、主人擁有者或管理員）
 * @param opportunityIdExtractor 從請求中提取機會ID的函數
 */
export const requireOpportunityAccess = (
  opportunityIdExtractor: (req: NextApiRequest) => string | undefined
): MiddlewareFunction => {
  return (handler) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      // 獲取用戶會話
      const session = await getSession({ req });

      if (!session || !session.user) {
        return res.status(401).json({ success: false, message: '未授權，請先登入' });
      }

      try {
        await connectToDatabase();

        // 從請求中獲取機會ID
        const opportunityId = opportunityIdExtractor(req);

        if (!opportunityId) {
          return res.status(400).json({ success: false, message: '無效的機會ID' });
        }

        // 確保用戶ID存在
        const userId = session.user.id;
        if (!userId) {
          return res.status(401).json({ success: false, message: '無效的用戶ID' });
        }

        // 查詢機會信息
        const opportunity = await require('@/models/Opportunity').default.findById(opportunityId);

        if (!opportunity) {
          return res.status(404).json({ success: false, message: '找不到該機會' });
        }

        // 確保 hostId 存在
        const opportunityHostId = opportunity.hostId?.toString();
        if (!opportunityHostId) {
          return res.status(404).json({ success: false, message: '機會缺少主人信息' });
        }

        // 檢查訪問權限
        const hasAccess = await checkHostAccess(userId, opportunityHostId);

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: '沒有權限訪問，需要主人擁有者或管理員權限'
          });
        }

        // 授權通過，繼續執行處理程序
        return handler(req, res);
      } catch (error) {
        console.error('驗證機會訪問權限時出錯:', error);
        return res.status(500).json({ success: false, message: '服務器錯誤' });
      }
    };
  };
};

/**
 * 組合多個中間件
 */
export const compose = (...middlewares: MiddlewareFunction[]): MiddlewareFunction => {
  return (handler) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
};

//===========================
// 資源訪問權限檢查函數
//===========================

/**
 * 檢查用戶是否有權限訪問特定主人
 * @param userId 用戶ID
 * @param hostId 主人ID
 * @returns 是否有訪問權限
 */
export async function checkHostAccess(userId: string, hostId: string): Promise<boolean> {
  try {
    // 驗證 hostId 是否為有效的 ObjectId
    const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);
    if (!isValidObjectId(hostId)) {
      console.error(`無效的 hostId 格式: ${hostId}`);
      return false;
    }

    // 連接數據庫
    await connectToDatabase();

    // 查詢用戶信息以確認是否為管理員
    const user = await User.findById(userId);

    // 如果是管理員，直接返回 true
    if (user && isAdmin(user)) {
      return true;
    }

    // 查詢主人信息以確認是否為擁有者
    const host = await Host.findById(hostId);

    if (!host) {
      return false;
    }

    // 檢查是否為主人擁有者
    return host.userId.toString() === userId;
  } catch (error) {
    console.error('檢查主人訪問權限出錯:', error);
    return false;
  }
}

/**
 * 檢查用戶是否有權限訪問組織
 * @param userId 用戶ID
 * @param organizationId 組織ID
 * @param organizationAdmins 組織管理員ID列表(可選)
 */
export async function checkOrganizationAccess(
  userId: string,
  organizationId: string,
  organizationAdmins?: string[]
): Promise<boolean> {
  try {
    // 連接數據庫
    await connectToDatabase();

    // 查詢用戶信息以確認是否為管理員
    const user = await User.findById(userId);

    // 如果是管理員，直接返回 true
    if (user && isAdmin(user)) {
      return true;
    }

    // 如果已提供組織管理員列表，直接檢查
    if (organizationAdmins) {
      return organizationAdmins.includes(userId);
    }

    // 否則查詢組織信息
    const Organization = require('@/models/Organization').default;
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return false;
    }

    // 檢查是否為組織管理員
    return organization.admins && organization.admins.includes(userId);
  } catch (error) {
    console.error('檢查組織訪問權限出錯:', error);
    return false;
  }
}

/**
 * 檢查用戶是否有權限訪問申請
 * @param userId 用戶ID
 * @param applicantId 申請者ID
 * @param hostId 主人ID
 */
export async function checkApplicationAccess(
  userId: string,
  applicantId?: string,
  hostId?: string
): Promise<boolean> {
  if (!userId) return false;

  try {
    // 連接數據庫
    await connectToDatabase();

    // 查詢用戶信息以確認角色
    const user = await User.findById(userId);

    // 檢查管理員權限
    if (user && isAdmin(user)) {
      return true;
    }

    // 檢查申請者身份
    const userIsApplicant = applicantId && userId === applicantId;

    // 檢查主人身份
    let userIsHost = false;
    if (hostId) {
      userIsHost = await checkHostAccess(userId, hostId);
    }

    return userIsApplicant || userIsHost;
  } catch (error) {
    console.error('檢查申請訪問權限出錯:', error);
    return false;
  }
}

/**
 * 驗證用戶是否有權訪問指定主人
 * 此中間件特別用於檢查URL參數中的hostId和session中的hostId是否匹配
 * 如果用戶是管理員，無論hostId是否匹配，都允許訪問
 */
export const requireHostAccess: MiddlewareFunction = (handler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // 獲取用戶會話
    const session = await getSession({ req });

    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: '未授權，請先登入' });
    }

    try {
      // 從URL獲取主人ID
      const { hostId } = req.query;

      // 如果沒有指定主人ID，返回錯誤
      if (!hostId || typeof hostId !== 'string') {
        return res.status(400).json({ success: false, message: '無效的主人ID' });
      }

      // 驗證 hostId 是否為有效的 ObjectId
      const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);
      if (!isValidObjectId(hostId)) {
        return res.status(400).json({ success: false, message: '無效的主人ID格式' });
      }

      // 檢查用戶是否為管理員
      await connectToDatabase();
      const user = await User.findById(session.user.id);

      // 如果是管理員，允許訪問
      if (user && isAdmin(user)) {
        return handler(req, res);
      }

      // 檢查會話中的hostId是否與URL中的hostId匹配
      if (session.user.hostId && session.user.hostId === hostId) {
        return handler(req, res);
      }

      // 否則檢查用戶是否是該主人的所有者
      const host = await Host.findById(hostId);
      if (host && host.userId.toString() === session.user.id) {
        return handler(req, res);
      }

      // 如果都不符合，拒絕訪問
      return res.status(403).json({
        success: false,
        message: '沒有權限訪問此主人資料'
      });
    } catch (error) {
      console.error('驗證主人訪問權限出錯:', error);
      return res.status(500).json({ success: false, message: '服務器錯誤' });
    }
  };
};

/**
 * 優化版的hostId提取中間件，自動提取URL中的hostId
 */
export const requireHostOwnerOrAdminFromUrl = (): MiddlewareFunction => {
  return requireHostOwnerOrAdmin((req) => {
    const { hostId } = req.query;
    return typeof hostId === 'string' ? hostId : undefined;
  });
};