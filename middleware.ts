import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * 全局路由中間件 (middleware.ts)
 *
 * 權責說明：
 * 1. 頁面層級的路由保護：攔截未授權訪問並重定向到登入頁
 * 2. 主人訪問控制：確保用戶只能訪問自己的主人頁面
 * 3. 基本權限檢查：管理員頁面保護
 *
 * 與 API 中間件 (authMiddleware.ts) 的區別：
 * - 本中間件處理頁面請求，authMiddleware 處理 API 請求
 * - 本中間件負責重定向，authMiddleware 負責返回 JSON 錯誤響應
 * - 本中間件進行基本權限檢查，authMiddleware 進行細粒度資源權限檢查
 */

// 不需要驗證的路徑
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
  '/auth/welcome',
  '/about',
  '/hosts', // 主人列表頁面
  '/opportunities', // 工作機會列表
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/images',
  '/api/hosts/register', // 主人註冊API
];

// 檢查路徑是否屬於公開路徑
const isPublicPath = (path: string) => {
  return publicPaths.some(publicPath => {
    // 精確匹配或者前綴匹配
    return path === publicPath || path.startsWith(`${publicPath}/`);
  });
};

// 調試模式啟用條件
const isDebugMode = process.env.NODE_ENV !== 'production';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 簡單日誌，僅在調試模式下啟用
  if (isDebugMode) {
    console.log(`[Route Middleware] 處理路徑: ${pathname}`);
  }

  // 對於公開路徑，直接允許訪問
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  try {
    // 檢查是否有token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // === 處理頁面請求 (非API請求) ===
    if (!pathname.startsWith('/api/')) {
      // 未登入用戶重定向到登入頁面
      if (!token) {
        const url = new URL(`/auth/signin`, request.url);
        url.searchParams.set('callbackUrl', encodeURIComponent(request.url));
        return NextResponse.redirect(url);
      }

      // 管理員頁面保護
      if (pathname.startsWith('/admin/')) {
        if (token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN') {
          // 非管理員嘗試訪問管理頁面，重定向到首頁
          return NextResponse.redirect(new URL('/', request.url));
        }
      }

      // 主人頁面訪問控制
      if (pathname.startsWith('/hosts/')) {
        return handleHostsRoutes(request, pathname, token);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('[Route Middleware Error]:', error);
    // 即使有錯誤，仍然繼續處理請求
    return NextResponse.next();
  }
}

/**
 * 處理主人相關路徑的訪問邏輯
 */
function handleHostsRoutes(
  request: NextRequest,
  pathname: string,
  token: any
) {
  // 主人註冊頁面特殊處理 - 已登入就可以訪問
  if (pathname === '/hosts/register') {
    return NextResponse.next();
  }

  // 從URL中提取hostId
  const hostIdMatch = pathname.match(/\/hosts\/([^\/]+)/);
  const urlHostId = hostIdMatch ? hostIdMatch[1] : null;

  // 特殊處理 /hosts/dashboard 路徑
  if (urlHostId === 'dashboard') {
    // 如果是dashboard但沒有hostId，重定向到註冊頁面
    if (!token?.hostId) {
      return NextResponse.redirect(new URL('/hosts/register', request.url));
    }

    // 如果有hostId，重定向到用戶的主人dashboard
    return NextResponse.redirect(new URL(`/hosts/${token.hostId}/dashboard`, request.url));
  }

  // 常規主人路徑檢查
  if (urlHostId) {
    // 如果用戶沒有主人ID，重定向到註冊頁面
    if (!token?.hostId) {
      return NextResponse.redirect(new URL('/hosts/register', request.url));
    }

    // 如果用戶嘗試訪問不是自己的主人頁面，且不是管理員，重定向到自己的主人頁面
    if (
      token.hostId !== urlHostId &&
      token.role !== 'ADMIN' &&
      token.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.redirect(new URL(`/hosts/${token.hostId}/dashboard`, request.url));
    }
  }

  return NextResponse.next();
}

// 設置中間件應用的路徑
export const config = {
  matcher: [
    // 具體匹配需要保護的路徑
    '/hosts/:path*',
    '/profile/:path*',
    '/admin/:path*',
    // 排除明確不需要中間件的靜態資源路徑
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};