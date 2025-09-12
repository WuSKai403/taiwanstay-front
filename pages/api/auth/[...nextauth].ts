import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import AppleProvider from 'next-auth/providers/apple';
import { compare } from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import { UserRole } from '../../../models/enums';
import { connectToDatabase } from '@/lib/mongodb';
import Host from '@/models/Host';
import mongoose from 'mongoose';

// 擴展默認的Session類型
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
      hostId?: string;
      hostName?: string;
      hostStatus?: string;
    }
  }
}

// 擴展JWT類型
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    hostId?: string;
    hostName?: string;
    hostStatus?: string;
  }
}

console.log('認證狀態:', {
  NODE_ENV: process.env.NODE_ENV
});

const providers = [];

// 添加電子郵件密碼登入
providers.push(
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: "電子郵件", type: "email" },
      password: { label: "密碼", type: "password" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('請輸入電子郵件和密碼');
      }

      try {
        const db = await getDb();
        const user = await db.collection('users').findOne({
          email: credentials.email
        });

        if (!user) {
          throw new Error('找不到此用戶');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('密碼錯誤');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role
        };
      } catch (error) {
        console.error('認證錯誤:', error);
        throw error;
      }
    }
  })
);

// 添加 Google 認證
providers.push(
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  })
);

// 添加一個錯誤處理器函數
const errorHandler = (error: Error, req: any, res: any) => {
  console.error('NextAuth 錯誤:', error);

  // 如果是開發模式，添加更多日誌
  if (process.env.NODE_ENV === 'development') {
    console.log('請求詳情:', {
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body ? '存在' : '無'
    });
  }

  return res;
};

export const authOptions: NextAuthOptions = {
  providers,
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    newUser: '/auth/welcome',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // 確保用戶有email
        if (!user.email) {
          console.error('登入沒有email:', user);
          return false;
        }

        const db = await getDb();
        const existingUser = await db.collection('users').findOne({ email: user.email });

        if (!existingUser) {
          // 新用戶註冊
          console.log('註冊新用戶:', user.email);
          const newUser = {
            email: user.email,
            name: user.name || user.email.split('@')[0],
            image: user.image,
            role: UserRole.USER,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await db.collection('users').insertOne(newUser);
          if (!result.acknowledged) {
            console.error('創建用戶失敗:', user.email);
            return false;
          }
        } else {
          // 更新現有用戶的最後登入時間
          await db.collection('users').updateOne(
            { email: user.email },
            { $set: { updatedAt: new Date() } }
          );
        }
        return true;
      } catch (error) {
        console.error('登入錯誤:', error);
        return false;
      }
    },
    async session({ session, token }) {
      try {
        // 從令牌中獲取擴展信息
        if (token) {
          // 記錄token信息，幫助診斷
          console.log('Session更新: 用戶ID =', token.id?.substring(0, 6) + '...');

          // 將token信息複製到session中
          session.user.id = token.id;
          session.user.role = token.role;
          session.user.hostId = token.hostId;
          session.user.hostName = token.hostName;
          session.user.hostStatus = token.hostStatus;
        } else {
          console.warn('Session回調中的token為空');
        }
        return session;
      } catch (error) {
        console.error('Session處理錯誤:', error);
        // 即使發生錯誤，也要返回session，避免登錄中斷
        return session;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
      }

      // 確保每次都刷新主人信息，而不僅在沒有hostId時
      if (token.id) {
        try {
          await connectToDatabase();

          // 先查詢用戶確認存在性
          const userData = await mongoose.connection.collection('users').findOne({
            _id: new mongoose.Types.ObjectId(token.id)
          });

          if (!userData) {
            console.error('JWT 用戶不存在:', token.id);
            return token;
          }

          // 查詢主人資料
          const hostData = await Host.findOne({ userId: token.id }).exec();

          if (hostData) {
            token.hostId = hostData._id.toString();
            token.hostName = hostData.name;
            token.hostStatus = hostData.status;
          } else {
            // 如果找不到主人資料，確保清除相關字段
            token.hostId = undefined;
            token.hostName = undefined;
            token.hostStatus = undefined;
          }
        } catch (error) {
          console.error('JWT 主人資料獲取錯誤:', error);
        }
      }

      return token;
    }
  },
  // 添加錯誤處理器
  events: {
    signIn({ user }) {
      console.log('用戶登入:', user?.email);
    },
    signOut({ session }) {
      console.log('用戶登出');
    },
    createUser({ user }) {
      console.log('創建用戶:', user.email);
    },
    linkAccount({ user }) {
      console.log('連結帳號:', user.email);
    },
    session({ session }) {
      if (process.env.NODE_ENV === 'development') {
        console.log('會話更新:', session.user?.email);
      }
    }
  },
  logger: {
    error(code, metadata) {
      console.error('NextAuth 錯誤:', { code, metadata });
    },
    warn(code) {
      console.warn('NextAuth 警告:', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth 調試:', code, metadata);
      }
    }
  }
};

export default NextAuth(authOptions);
