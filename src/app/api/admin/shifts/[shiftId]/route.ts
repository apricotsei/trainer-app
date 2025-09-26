import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import type { OkPacket } from 'mysql2/promise';

export async function PATCH(
    request: NextRequest, 
    { params }: { params: { shiftId: string } }
) {
    const { shiftId } = params; // これで shiftId を安全に取り出せる

    if (!shiftId || isNaN(Number(shiftId))) {
        return NextResponse.json({ error: '無効なシフトIDです。' }, { status: 400 });
    }

    try {
        const body: { status: 'confirmed' | 'rejected' } = await request.json();
        const { status } = body;

        if (status !== 'confirmed' && status !== 'rejected') {
            return NextResponse.json({ error: '無効なステータスです。' }, { status: 400 });
        }

        const sql = `
            UPDATE shifts
            SET status = ?
            WHERE id = ? AND status = 'pending'
        `;

        const [result] = await db.query<OkPacket>(sql, [status, shiftId]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: '更新対象のシフトが見つからないか、既に処理済みです。' }, { status: 404 });
        }

        return NextResponse.json({ message: `シフトのステータスを ${status} に更新しました。` });

    } catch (error) {
        console.error(`シフト(ID: ${shiftId})の更新に失敗しました:`, error);
        return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}