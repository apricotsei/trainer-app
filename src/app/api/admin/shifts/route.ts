import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

// グループ化されるシフトの型を定義
type ShiftInGroup = {
    id: number;
    start_time: string;
    end_time: string;
    status: string;
};

// GETメソッドで'pending'状態のシフトをトレーナーごとにグループ化して取得する
export async function GET(_request: NextRequest) {
    try {
        const sql = `
            SELECT
                s.id,
                s.start_time,
                s.end_time,
                s.status,
                t.id AS trainer_id,
                t.name AS trainer_name
            FROM shifts AS s
            JOIN trainers AS t ON s.trainer_id = t.id
            WHERE s.status = 'pending'
            ORDER BY t.name ASC, s.start_time ASC;
        `;

        const [rows] = await db.query<RowDataPacket[]>(sql);

        // 取得したシフトをトレーナーごとにグループ化する
        const groupedByTrainer = new Map<number, { trainer_id: number; trainer_name: string; shifts: ShiftInGroup[] }>();

        rows.forEach(row => {
            if (!groupedByTrainer.has(row.trainer_id)) {
                groupedByTrainer.set(row.trainer_id, {
                    trainer_id: row.trainer_id,
                    trainer_name: row.trainer_name,
                    shifts: []
                });
            }
            groupedByTrainer.get(row.trainer_id)?.shifts.push({
                id: row.id,
                start_time: new Date(row.start_time).toISOString(),
                end_time: new Date(row.end_time).toISOString(),
                status: row.status
            });
        });

        const result = Array.from(groupedByTrainer.values());

        return NextResponse.json(result);

    } catch (error) {
        console.error('申請中シフトの取得に失敗しました:', error);
        return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}