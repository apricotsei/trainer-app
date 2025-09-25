import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

export async function GET(_request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
    }
    const trainerId = session.user.id;

    try {
        // ★ 修正点: DATE()関数を避け、BETWEEN句で1日を範囲指定する
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const sql = `
            SELECT id, clock_in_time FROM attendances 
            WHERE trainer_id = ? 
                AND clock_out_time IS NULL 
                AND clock_in_time BETWEEN ? AND ?
            ORDER BY clock_in_time DESC LIMIT 1
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [trainerId, todayStart, todayEnd]);
        
        if (rows.length > 0) {
            return NextResponse.json({ status: 'clocked_in', clockInTime: rows[0].clock_in_time });
        } else {
            return NextResponse.json({ status: 'clocked_out' });
        }

    } catch (error) {
        console.error('勤怠状況の取得に失敗しました:', error);
        return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}