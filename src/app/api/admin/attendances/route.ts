import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'アクセス権がありません。' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        let sql = `
            SELECT
                a.id,
                a.clock_in_time,
                a.clock_out_time,
                t.name AS trainer_name
            FROM attendances AS a
            JOIN trainers AS t ON a.trainer_id = t.id
        `;
        const params: (string | Date)[] = [];

        if (from && to) {
            const fromDate = new Date(from);
            fromDate.setHours(0, 0, 0, 0);
            
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);

            sql += ` WHERE a.clock_in_time BETWEEN ? AND ?`;
            params.push(fromDate, toDate);
        }

        sql += ` ORDER BY a.clock_in_time DESC;`;

        const [rows] = await db.query<RowDataPacket[]>(sql, params);

        const history = rows.map(row => ({
            ...row,
            clock_in_time: new Date(row.clock_in_time).toISOString(),
            clock_out_time: row.clock_out_time ? new Date(row.clock_out_time).toISOString() : null,
        }));

        return NextResponse.json(history);

    } catch (error) {
        console.error('全勤怠履歴の取得に失敗しました:', error);
        return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}