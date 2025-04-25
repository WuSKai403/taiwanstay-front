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