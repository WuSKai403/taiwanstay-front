import { UserRole } from '.';
import NextAuth from 'next-auth';

declare module 'next-auth' {
  /**
   * 擴展 Session 類型
   */
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
    };
  }

  /**
   * 擴展 User 類型
   */
  interface User {
    role?: UserRole;
  }
}

declare module 'next-auth/jwt' {
  /**
   * 擴展 JWT 類型
   */
  interface JWT {
    role?: UserRole;
  }
}