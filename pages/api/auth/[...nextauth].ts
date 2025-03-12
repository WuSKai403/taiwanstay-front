import NextAuth, { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { clientPromise } from '../../../lib/mongodb';
import { UserRole } from '../../../types';

// NextAuth 配置
export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          username: profile.login,
          email: profile.email,
          image: profile.avatar_url,
          followers: profile.followers,
          verified: true
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // 將用戶角色添加到 JWT 令牌中
      if (user) {
        token.role = user.role || UserRole.USER;
        token.userId = user.id;
        token.organizationId = user.organizationId;
        token.hostId = user.hostId;
      }
      return token;
    },
    async session({ session, token }) {
      // 將用戶角色添加到會話中
      if (session.user) {
        session.user.role = token.role as UserRole;
        session.user.id = token.userId as string;
        session.user.organizationId = token.organizationId as string | undefined;
        session.user.hostId = token.hostId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },
};

export default NextAuth(authOptions);
