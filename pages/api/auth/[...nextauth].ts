import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { clientPromise } from '../../../lib/mongodb';
import dbConnect from '@/lib/dbConnect';
import { User } from '../../../models/index';
import { UserRole } from '../../../models/enums';

// 檢查環境變數是否開啟認證
const isAuthEnabled = process.env.ENABLE_AUTH !== 'false';
console.log('Auth enabled status:', isAuthEnabled, 'ENABLE_AUTH=', process.env.ENABLE_AUTH);

// 使用 any 類型來解決類型問題
type AnyUser = any;

export const authOptions: NextAuthOptions = {
  // 配置 MongoDB 適配器
  adapter: MongoDBAdapter(clientPromise),

  // 配置會話
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30天
  },

  // 配置認證提供者
  providers: [
    // 憑證提供者（用戶名/密碼）
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '電子郵件', type: 'email' },
        password: { label: '密碼', type: 'password' }
      },
      async authorize(credentials, req): Promise<AnyUser> {
        // 如果認證被禁用，返回測試用戶
        if (!isAuthEnabled) {
          console.log('認證已禁用，使用測試用戶');
          return {
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
            role: UserRole.USER,
            hostId: '65f2d1f2e5c57e9b4c3a1234' // 添加一個測試主機ID
          };
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 連接到數據庫
          await dbConnect();

          // 查找用戶
          const user = await User.findOne({ email: credentials.email });
          if (!user) {
            return null;
          }

          // 驗證密碼
          // 注意：在實際應用中，應該使用bcrypt等工具比較加密後的密碼
          if (user.password !== credentials.password) {
            return null;
          }

          // 返回用戶資料（不包含密碼）
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.profile?.avatar,
            hostId: user.hostId?.toString()
          };
        } catch (error) {
          console.error('認證失敗:', error);
          return null;
        }
      }
    })
  ],

  // 配置頁面
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user'
  },

  // 配置回調
  callbacks: {
    async jwt({ token, user }) {
      // 如果有用戶資料，將其添加到令牌中
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.hostId = user.hostId;
      }
      return token;
    },

    async session({ session, token }) {
      // 將令牌中的資料添加到會話中
      if (token && session.user) {
        // 使用類型斷言和安全的類型檢查
        const id = typeof token.id === 'string' ? token.id : '';
        session.user.id = id;

        // 使用 as any 類型斷言來解決類型問題
        session.user.role = (token.role || UserRole.USER) as any;
        session.user.hostId = token.hostId as any;
      }
      return session;
    }
  },

  // 啟用調試（僅在開發環境）
  debug: process.env.NODE_ENV === 'development'
};

export default NextAuth(authOptions);
