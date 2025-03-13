import { UserRole } from '../models/enums/UserRole';

/**
 * 檢查用戶是否為管理員
 * @param user 用戶對象或包含 role 屬性的對象
 * @returns 是否為管理員
 */
export function isAdmin(user?: { role?: UserRole }): boolean {
  return user?.role !== undefined && user.role === UserRole.ADMIN;
}

/**
 * 檢查用戶是否為主人
 * @param user 用戶對象或包含 role 屬性的對象
 * @returns 是否為主人
 */
export function isHost(user?: { role?: UserRole }): boolean {
  return user?.role !== undefined && user.role === UserRole.HOST;
}

/**
 * 檢查用戶是否為組織管理員
 * @param user 用戶對象或包含 role 屬性的對象
 * @returns 是否為組織管理員
 */
export function isOrganizationAdmin(user?: { role?: UserRole }): boolean {
  return user?.role !== undefined && user.role === UserRole.ORGANIZATION;
}

/**
 * 檢查用戶是否為普通用戶
 * @param user 用戶對象或包含 role 屬性的對象
 * @returns 是否為普通用戶
 */
export function isUser(user?: { role?: UserRole }): boolean {
  return user?.role !== undefined && user.role === UserRole.USER;
}

/**
 * 檢查用戶是否有特定角色
 * @param user 用戶對象或包含 role 屬性的對象
 * @param role 要檢查的角色
 * @returns 是否有特定角色
 */
export function hasRole(user?: { role?: UserRole }, role?: UserRole): boolean {
  return user?.role !== undefined && role !== undefined && user.role === role;
}

/**
 * 檢查用戶是否有權限訪問組織
 * @param user 用戶對象或包含 role 和 id 屬性的對象
 * @param organizationAdmins 組織管理員 ID 列表
 * @returns 是否有權限訪問組織
 */
export function canAccessOrganization(
  user?: { role?: UserRole; id?: string },
  organizationAdmins?: string[]
): boolean {
  const userIsAdmin = isAdmin(user);
  const userIsOrgAdmin = user?.id && organizationAdmins?.includes(user.id);

  return userIsAdmin || !!userIsOrgAdmin;
}

/**
 * 檢查用戶是否有權限訪問申請
 * @param user 用戶對象或包含 role 和 id 屬性的對象
 * @param applicantId 申請者 ID
 * @param hostId 主人 ID
 * @returns 是否有權限訪問申請
 */
export function canAccessApplication(
  user?: { role?: UserRole; id?: string },
  applicantId?: string,
  hostId?: string
): boolean {
  if (!user?.id) return false;

  const userIsAdmin = isAdmin(user);
  const userIsApplicant = user.id === applicantId;
  const userIsHost = user.id === hostId;

  return userIsAdmin || userIsApplicant || userIsHost;
}
