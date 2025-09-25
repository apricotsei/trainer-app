import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader } from 'mysql2';

export async function POST(request: NextRequest) {
    try {
        const { name } = await request.json();

        // 名前のバリデーション
        if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const sql = `INSERT INTO trainers (name) VALUES (?)`;
        const [result] = await db.query<ResultSetHeader>(sql, [name]);

        const newTrainerId = result.insertId;

        // 成功した場合、新しいトレーナーIDを返す
        return NextResponse.json({ 
        message: 'Trainer registered successfully',
        trainer_id: newTrainerId 
        }, { status: 201 });

    } catch (error) {
        console.error('Registration failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}