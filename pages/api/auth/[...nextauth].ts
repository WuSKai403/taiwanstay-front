import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import { getDb } from '@/lib/mongodb';
import { UserRole } from '../../../models/enums';

// 檢查是否啟用認證
const isAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH !== 'false';
console.log('認證狀態:', {
  isAuthEnabled,
  NEXT_PUBLIC_ENABLE_AUTH: process.env.NEXT_PUBLIC_ENABLE_AUTH,
  NODE_ENV: process.env.NODE_ENV
});

const providers = [];

// 添加開發環境的測試帳號
if (process.env.NODE_ENV === 'development' && !isAuthEnabled) {
  providers.push(
    Credentials({
      name: 'Development',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize() {
        return {
          id: 'test-user',
          name: 'Test User',
          email: 'test@example.com'
        };
      }
    })
  );
}

// 添加 GitHub 認證
providers.push(
  GithubProvider({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  })
);

export default NextAuth({
  providers,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (process.env.NODE_ENV === 'development' && !isAuthEnabled) {
          return true;
        }

        const db = await getDb();
        const existingUser = await db.collection('users').findOne({ email: user.email });

        if (!existingUser) {
          await db.collection('users').insertOne({
            email: user.email,
            name: user.name,
            image: user.image,
            role: UserRole.USER,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return true;
      } catch (error) {
        console.error('登入錯誤:', error);
        return false;
      }
    },
    async session({ session, token }) {
      try {
        if (process.env.NODE_ENV === 'development' && !isAuthEnabled) {
          session.user.id = 'test-user';
          session.user.role = UserRole.USER;
          return session;
        }

        const db = await getDb();
        const user = await db.collection('users').findOne({ email: session.user.email });

        if (user) {
          session.user.id = user._id.toString();
          session.user.role = user.role;
        }
        return session;
      } catch (error) {
        console.error('Session 錯誤:', error);
        return session;
      }
    },
  }
});
