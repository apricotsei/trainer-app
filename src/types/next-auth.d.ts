import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// NextAuthの型定義を拡張して、カスタムプロパティを追加します。

declare module "next-auth" {
    /**
     * authorizeコールバックから返されるUserオブジェクトにroleプロパティを追加
     */
    interface User extends DefaultUser {
        role: 'admin' | 'trainer';
    }

    /**
     * useSession()などで取得できるSessionオブジェクトにidとroleを追加
     */
    interface Session extends DefaultSession {
        user?: {
            id?: string | null;
            role?: 'admin' | 'trainer' | null;
        } & DefaultSession["user"];
    }
}

/**
 * JWTトークンにidとroleを追加
 */
declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id?: string;
        role?: 'admin' | 'trainer';
    }
}