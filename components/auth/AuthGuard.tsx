import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, ReactNode } from 'react';
import { UserRole } from '../../types';

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

/**
 * 身份驗證守衛組件
 * 用於保護需要登入的頁面
 * 如果用戶未登入，將重定向到登入頁面
 * 如果指定了所需角色，將檢查用戶是否具有該角色
 */
export default function AuthGuard({
  children,
  requiredRoles,
  redirectTo = '/auth/signin',
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    // 如果不是加載中且未登入，重定向到登入頁面
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // 如果指定了所需角色，檢查用戶是否具有該角色
    if (
      !isLoading &&
      isAuthenticated &&
      requiredRoles &&
      requiredRoles.length > 0 &&
      session?.user?.role
    ) {
      const userRole = session.user.role as UserRole;
      const hasRequiredRole = requiredRoles.includes(userRole);

      // 如果用戶沒有所需角色，重定向到登入頁面
      if (!hasRequiredRole) {
        router.push(redirectTo);
      }
    }
  }, [isLoading, isAuthenticated, session, router, redirectTo, requiredRoles]);

  // 如果正在加載，顯示加載指示器
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // 如果未登入或沒有所需角色，不顯示任何內容（將由 useEffect 重定向）
  if (!isAuthenticated) {
    return null;
  }

  // 如果指定了所需角色，檢查用戶是否具有該角色
  if (requiredRoles && requiredRoles.length > 0 && session?.user?.role) {
    const userRole = session.user.role as UserRole;
    const hasRequiredRole = requiredRoles.includes(userRole);

    if (!hasRequiredRole) {
      return null;
    }
  }

  // 如果已登入且具有所需角色，顯示子組件
  return <>{children}</>;
}