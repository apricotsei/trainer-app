import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

// 認証をダミーで代替（将来的にはNextAuthなどに置き換える）
async function getAuthenticatedTrainerId(request: NextRequest): Promise<number | null> {
    // 本来はセッションからトレーナーIDを取得します。
    // ここでは、簡単のためクエリパラメータから取得するダミー実装とします。
    const trainerId = request.nextUrl.searchParams.get('trainerId');
    if (trainerId) {
        return parseInt(trainerId, 10);
    }
    return 1; // デフォルトまたはテスト用のID
}

export async function GET(request: NextRequest) {
    try {
        const trainerId = await getAuthenticatedTrainerId(request);

        if (!trainerId) {
            return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
        }

        const sql = `
            SELECT 
                b.id,
                b.session_start_time,
                b.session_end_time,
                b.status,
                u.full_name AS customer_name
            FROM bookings AS b
            JOIN users AS u ON b.customer_id = u.id
            JOIN shifts AS s ON b.shift_id = s.id
            WHERE s.trainer_id = ?
            ORDER BY b.session_start_time ASC;
        `;

        const [bookings] = await db.query<RowDataPacket[]>(sql, [trainerId]);

        return NextResponse.json(bookings);

    } catch (error) {
        console.error('Failed to fetch bookings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}