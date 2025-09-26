import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

type ReqBody = {
    action: 'clock_in' | 'clock_out';
}

// 今日の未退勤レコードを取得する関数
async function getOpenAttendance(trainerId: string) {
    // ★ 修正点: DATE()関数を避け、BETWEEN句で1日を範囲指定する
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const sql = `
        SELECT id FROM attendances 
        WHERE trainer_id = ? 
            AND clock_out_time IS NULL 
            AND clock_in_time BETWEEN ? AND ?
        ORDER BY clock_in_time DESC LIMIT 1
    `;
    const [rows] = await db.query<RowDataPacket[]>(sql, [trainerId, todayStart, todayEnd]);
    return rows[0];
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
    }
    const trainerId = session.user.id;

    try {
        const { action } = (await request.json()) as ReqBody;
        const now = new Date();

        if (action === 'clock_in') {
            const openAttendance = await getOpenAttendance(trainerId);
            if (openAttendance) {
                return NextResponse.json({ error: '既に出勤済みです。' }, { status: 409 });
            }
            const [result] = await db.query<ResultSetHeader>(
                'INSERT INTO attendances (trainer_id, clock_in_time) VALUES (?, ?)',
                [trainerId, now]
            );
            return NextResponse.json({ message: '出勤打刻が完了しました。', attendanceId: result.insertId }, { status: 201 });
        }

        if (action === 'clock_out') {
            const openAttendance = await getOpenAttendance(trainerId);
            if (!openAttendance) {
                return NextResponse.json({ error: '退勤する出勤記録がありません。' }, { status: 404 });
            }
            await db.query(
                'UPDATE attendances SET clock_out_time = ? WHERE id = ?',
                [now, openAttendance.id]
            );
            return NextResponse.json({ message: '退勤打刻が完了しました。' });
        }

        return NextResponse.json({ error: '無効な操作です。' }, { status: 400 });

    } catch (error) {
        console.error('勤怠打刻に失敗しました:', error);
        return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}