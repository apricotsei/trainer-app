import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import type { RowDataPacket } from 'mysql2';
import { User } from 'next-auth';

// Trainerの型をデータベースに合わせて定義
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
            async authorize(credentials): Promise<User | null> {
                if (!credentials?.trainerId || !credentials?.password) {
                    return null;
                }

                try {
                    const sql = 'SELECT * FROM trainers WHERE id = ?';
                    const [rows] = await db.query<Trainer[]>(sql, [credentials.trainerId]);

                    if (rows.length === 0) {
                        return null;
                    }

                    const trainer = rows[0];

                    // bcryptハッシュは'$2a$', '$2b$', '$2y$'などで始まるため、'$2'で始まるかどうかで判定する
                    const isHashed = trainer.password_hash.startsWith('$2');
                    let passwordMatch = false;

                    if (isHashed) {
                        passwordMatch = await bcrypt.compare(credentials.password, trainer.password_hash);
                    } else {
                        if (credentials.password === trainer.password_hash) {
                            const hashedPassword = await bcrypt.hash(credentials.password, 10);
                            await db.query('UPDATE trainers SET password_hash = ? WHERE id = ?', [hashedPassword, trainer.id]);
                            passwordMatch = true;
                        }
                    }
                    
                    if (passwordMatch) {
                        return {
                            id: trainer.id.toString(),
                            name: trainer.name,
                            role: trainer.role,
                        };
                    } else {
                        return null;
                    }
                } catch (error) {
                    console.error('Authorize error:', error);
                    return null;
                }
            }
        })
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };