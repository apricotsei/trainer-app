import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader } from 'mysql2';
import { Shift } from '@/types/db';

type PostShiftPayload = Omit<Shift, 'id' | 'status' | 'created_at' | 'updated_at' | 'trainer_id' | 'start_time' | 'end_time'> & {
    trainer_id: number;
    start_time: string; // YYYY-MM-DD HH:MM:SS 形式の文字列
    end_time: string;   // YYYY-MM-DD HH:MM:SS 形式の文字列
};


export async function POST(request: NextRequest) {
    try {
        const { trainer_id, start_time, end_time } = (await request.json()) as PostShiftPayload;

        if (!trainer_id || !start_time || !end_time) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        // フロントエンドからフォーマット済みの文字列が送られてくるので、変換は不要
        const sql = `
        INSERT INTO shifts (trainer_id, start_time, end_time, status)
        VALUES (?, ?, ?, 'pending')
        `;
        
        // 受け取った値をそのままデータベースクエリに渡す
        const [result] = await db.query<ResultSetHeader>(sql, [trainer_id, start_time, end_time]);
        
        const insertedId = result.insertId;

        // フロントエンドに返すために、新しいShiftオブジェクトを作成
        const newShift: Shift = {
            id: insertedId,
            trainer_id,
            start_time, // 文字列のまま返す
            end_time,   // 文字列のまま返す
            status: 'pending'
        };

        return NextResponse.json({ 
            message: 'Shift submitted successfully',
            shift: newShift 
        }, { status: 201 });

    } catch (error) {
        console.error('Failed to submit shift:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ 
            error: 'Internal Server Error', 
            details: errorMessage
        }, { status: 500 });
    }
}