import { useSession } from 'next-auth/react';
import { UserRole } from '@/models/enums/UserRole';
import Link from 'next/link';

export default function Navbar() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.SUPER_ADMIN;

  return (
    <div>
      {/* ... existing navbar code ... */}

      {/* 用戶選單 */}
      <div>
        {session ? (
          <div>
            {/* ... existing menu items ... */}

            {/* 管理員專屬入口 */}
            {isAdmin && (
              <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                管理員中心
              </Link>
            )}

            {/* ... other menu items ... */}
          </div>
        ) : (
          // ... login button ...
          <div>登入按鈕</div>
        )}
      </div>
    </div>
  );
}