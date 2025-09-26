import { db } from '@/lib/db';
import { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import type { RowDataPacket } from 'mysql2';

// データベースから取得するトレーナー情報の型定義
interface Trainer extends RowDataPacket {
    id: number;
    name: string;
    role: 'admin' | 'trainer';
    password_hash: string;
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                trainerId: { label: "トレーナーID", type: "text" },
                password: { label: "パスワード", type: "password" }
            },
            async authorize(credentials): Promise<NextAuthUser | null> {
                if (!credentials?.trainerId || !credentials?.password) return null;

                try {
                    const sql = 'SELECT * FROM trainers WHERE id = ?';
                    const [rows] = await db.query<Trainer[]>(sql, [credentials.trainerId]);
                    if (rows.length === 0) return null;

                    const trainer = rows[0];
                    const isHashed = trainer.password_hash.startsWith('$2');
                    let passwordMatch = false;

                    if (isHashed) {
                        passwordMatch = await bcrypt.compare(credentials.password, trainer.password_hash);
                    } else {
                        // 初回ログイン時の平文パスワード比較とハッシュ化
                        if (credentials.password === trainer.password_hash) {
                            const hashedPassword = await bcrypt.hash(credentials.password, 10);
                            await db.query('UPDATE trainers SET password_hash = ? WHERE id = ?', [hashedPassword, trainer.id]);
                            passwordMatch = true;
                        }
                    }

                    if (passwordMatch) {
                        // NextAuthが期待するUserオブジェクトを返す
                        return {
                            id: trainer.id.toString(),
                            name: trainer.name,
                            role: trainer.role, // カスタムプロパティ
                        };
                    }
                    return null;
                } catch (error) {
                    console.error('Authorize error:', error);
                    return null;
                }
            }
        })
    ],
    session: { 
        strategy: 'jwt' 
    },
    callbacks: {
        // JWTトークンにカスタム情報を追加
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                // Userオブジェクトの型を拡張する必要があるため、anyキャストを使用
                token.role = (user as any).role; 
            }
            return token;
        },
        // セッションオブジェクトにカスタム情報を追加
        async session({ session, token }) {
            if (session.user) {
                // Sessionユーザーオブジェクトの型を拡張する必要があるため、anyキャストを使用
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        }
    },
    pages: { 
        signIn: '/login' 
    },
    secret: process.env.NEXTAUTH_SECRET,
};