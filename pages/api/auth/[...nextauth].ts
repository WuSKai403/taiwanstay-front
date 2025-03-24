import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import { compare } from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import { UserRole } from '../../../models/enums';

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
        const db = await getDb();
        const existingUser = await db.collection('users').findOne({ email: user.email });

        if (!existingUser) {
          await db.collection('users').insertOne({
            email: user.email,
            name: user.name,
            image: user.image,
            role: UserRole.USER,
            createdAt: new Date(),
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    }
  }
});
