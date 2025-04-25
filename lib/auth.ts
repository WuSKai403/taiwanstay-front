import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { connectToDatabase } from './mongodb';
import { ObjectId } from 'mongodb';
import { isValidObjectId } from '@/utils/helpers';
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { UserRole } from '@/models/enums/UserRole';

// 定義 JWT token 的類型
interface CustomToken {
  id?: string;
  role?: string;
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
}

/**
 * NextAuth 配置選項
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('請輸入電子郵件和密碼');
        }

        try {
          const { db } = await connectToDatabase();
          const user = await db.collection('users').findOne({
            email: credentials.email.toLowerCase()
          });

          if (!user) {
            throw new Error('找不到此用戶');
          }

          const isPasswordValid = await compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error('密碼錯誤');
          }

          // 確保 _id 是有效的 ObjectId
          if (!user._id || !isValidObjectId(user._id.toString())) {
            console.error('無效的用戶 ID:', user._id);
            throw new Error('用戶 ID 格式無效');
          }

          const userId = user._id.toString();
          console.log('用戶認證成功:', {
            userId,
            email: user.email,
            role: user.role
          });

          return {
            id: userId,
            email: user.email,
            name: user.name,
            role: user.role
          };
        } catch (error) {
          console.error('認證錯誤:', error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // 驗證用戶 ID
        if (!user.id || !isValidObjectId(user.id)) {
          console.error('JWT 回調 - 無效的用戶 ID:', user.id);
          throw new Error('無效的用戶 ID');
        }

        console.log('JWT 回調 - 用戶信息:', {
          id: user.id,
          email: user.email,
          role: user.role
        });

        return {
          ...token,
          id: user.id,
          role: user.role
        };
      }
      return token;
    },
    async session({ session, token }) {
      const customToken = token as CustomToken;

      if (customToken) {
        // 驗證 token 中的 ID
        if (!customToken.id || !isValidObjectId(customToken.id)) {
          console.error('Session 回調 - 無效的 token ID:', customToken.id);
          throw new Error('無效的 token ID');
        }

        console.log('Session 回調 - Token 信息:', {
          id: customToken.id,
          role: customToken.role
        });

        return {
          ...session,
          user: {
            ...session.user,
            id: customToken.id,
            role: customToken.role as string
          }
        };
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    newUser: '/auth/register'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60
  },
  debug: process.env.NODE_ENV === 'development'
};

/**
 * 檢查用戶是否已登入（服務端專用）
 *
 * 使用示例:
 * ```
 * if (!(await isAuthenticated(req))) {
 *   return { redirect: { destination: '/login', permanent: false } };
 * }
 * ```
 */
export async function isAuthenticated(
  req: NextApiRequest | GetServerSidePropsContext['req'],
  res?: NextApiResponse | GetServerSidePropsContext['res']
) {
  const session = await getSession({ req });
  return !!session?.user;
}