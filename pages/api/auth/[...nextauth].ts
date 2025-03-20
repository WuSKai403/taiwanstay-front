import NextAuth, { Session, DefaultSession, User, Account, Profile } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getDb } from '@/lib/mongodb';
import { UserRole } from '../../../models/enums';

// 檢查環境變數是否開啟認證
const isAuthEnabled = process.env.ENABLE_AUTH !== 'false';
console.log('Auth enabled status:', isAuthEnabled, 'ENABLE_AUTH=', process.env.ENABLE_AUTH);

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      role?: UserRole;
    } & DefaultSession['user'];
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: User; account: Account | null; profile?: Profile }) {
      try {
        const db = await getDb();
        const existingUser = await db.collection('users').findOne({ email: user.email });

        if (!existingUser) {
          // 創建新用戶
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
        console.error('Sign in error:', error);
        return false;
      }
    },
    async session({ session, token }: { session: Session; token: any }) {
      try {
        const db = await getDb();
        const user = await db.collection('users').findOne({ email: session.user.email });

        if (user) {
          session.user.id = user._id.toString();
          session.user.role = user.role;
        }
        return session;
      } catch (error) {
        console.error('Session error:', error);
        return session;
      }
    },
  },
};

export default NextAuth(authOptions);
