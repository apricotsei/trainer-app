import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import type { ResultSetHeader } from 'mysql2';

type ReqBody = {
    name: string;
    password?: string;
    adminCode?: string; // 管理者登録コード用のプロパティを追加
}

export async function POST(request: NextRequest) {
    try {
        const { name, password, adminCode } = (await request.json()) as ReqBody;

        if (!name || !password) {
            return NextResponse.json({ error: '名前とパスワードは必須です。' }, { status: 400 });
        }

        // .env.localファイルから管理者登録コードを取得し、正しいかチェック
        const role = adminCode === process.env.ADMIN_REGISTRATION_CODE ? 'admin' : 'trainer';

        // パスワードをハッシュ化
        const hashedPassword = await bcrypt.hash(password, 10);

        // roleも一緒にデータベースに登録
        const sql = `
            INSERT INTO trainers (name, password_hash, role)
            VALUES (?, ?, ?)
        `;

        const [result] = await db.query<ResultSetHeader>(sql, [name, hashedPassword, role]);

        const insertedId = result.insertId;

        return NextResponse.json({ 
            message: 'トレーナーの登録が成功しました。',
            trainerId: insertedId,
            role: role // 登録された役割を返す
        }, { status: 201 });

    } catch (error) {
        console.error('トレーナーの登録に失敗しました:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ 
            error: 'サーバーエラーが発生しました。', 
            details: errorMessage
        }, { status: 500 });
    }
}