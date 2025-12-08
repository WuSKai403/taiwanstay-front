import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { api } from "@/lib/api";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const response = await api.post("/auth/login", {
                        loginType: "password",
                        email: credentials.email,
                        password: credentials.password,
                    });

                    const { user, token } = response.data;

                    if (user && token) {
                        return { ...user, accessToken: token, id: user.id };
                    }
                    return null;
                } catch (error) {
                    console.error("Login failed:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                try {
                    // Send Google ID Token to backend for verification and account creation/linking
                    const response = await api.post("/auth/login", {
                        loginType: "google",
                        email: user.email,
                        token: account.id_token,
                    });

                    const { user: backendUser, token } = response.data;

                    // Attach backend token to the user object so it can be persisted in the JWT callback
                    user.accessToken = token;
                    user.id = backendUser.id;

                    return true;
                } catch (error) {
                    console.error("Google login failed at backend:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.accessToken = user.accessToken;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.accessToken = token.accessToken as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/login",
    },
    session: {
        strategy: "jwt",
    },
};
