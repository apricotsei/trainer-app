import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
    }
    const trainerId = session.user.id;

    try {
        const sql = `
            SELECT id, clock_in_time, clock_out_time 
            FROM attendances 
            WHERE trainer_id = ?
            ORDER BY clock_in_time DESC;
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [trainerId]);

        // フロントエンドで扱いやすいようにISO文字列に変換
        const history = rows.map(row => ({
            ...row,
            clock_in_time: new Date(row.clock_in_time).toISOString(),
            clock_out_time: row.clock_out_time ? new Date(row.clock_out_time).toISOString() : null,
        }));

        return NextResponse.json(history);

    } catch (error) {
        console.error('勤怠履歴の取得に失敗しました:', error);
        return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}