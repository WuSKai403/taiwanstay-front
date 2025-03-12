import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { UserRole } from '../types';

// 檢查用戶是否已登入
export async function isAuthenticated(
  req: NextApiRequest | GetServerSidePropsContext['req'],
  res?: NextApiResponse | GetServerSidePropsContext['res']
) {
  const session = await getSession({ req });
  return !!session;
}

// 檢查用戶是否具有特定角色
export async function hasRole(
  req: NextApiRequest | GetServerSidePropsContext['req'],
  role: UserRole | UserRole[],
  res?: NextApiResponse | GetServerSidePropsContext['res']
) {
  const session = await getSession({ req });

  if (!session || !session.user) {
    return false;
  }

  const userRole = session.user.role as UserRole;

  if (Array.isArray(role)) {
    return role.includes(userRole);
  }

  return userRole === role;
}

// 檢查用戶是否為組織管理員
export async function isOrganizationAdmin(
  req: NextApiRequest | GetServerSidePropsContext['req'],
  organizationId: string,
  res?: NextApiResponse | GetServerSidePropsContext['res']
) {
  const session = await getSession({ req });

  if (!session || !session.user) {
    return false;
  }

  const userRole = session.user.role as UserRole;

  // 如果是系統管理員，直接返回 true
  if (userRole === UserRole.ADMIN) {
    return true;
  }

  // 如果是組織管理員，檢查是否為該組織的管理員
  if (userRole === UserRole.ORGANIZATION_ADMIN) {
    return session.user.organizationId === organizationId;
  }

  return false;
}

// 檢查用戶是否為主人或組織管理員
export async function isHostOrOrganizationAdmin(
  req: NextApiRequest | GetServerSidePropsContext['req'],
  hostId: string,
  res?: NextApiResponse | GetServerSidePropsContext['res']
) {
  const session = await getSession({ req });

  if (!session || !session.user) {
    return false;
  }

  const userRole = session.user.role as UserRole;

  // 如果是系統管理員，直接返回 true
  if (userRole === UserRole.ADMIN) {
    return true;
  }

  // 如果是主人，檢查是否為該主人
  if (userRole === UserRole.HOST) {
    return session.user.hostId === hostId;
  }

  // 如果是組織管理員，需要檢查該主人是否屬於該組織
  // 這部分需要在 API 路由中實現，因為需要查詢數據庫

  return false;
}