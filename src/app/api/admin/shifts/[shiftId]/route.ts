import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import type { OkPacket } from 'mysql2';

type RouteContext = {
    params: {
        shiftId: string;
    }
}

type PatchBody = {
    status: 'confirmed' | 'rejected'; // 更新後のステータス
}

// PATCHメソッドでシフトのステータスを更新する
export async function PATCH(request: NextRequest, { params }: RouteContext) {
    const { shiftId } = params;

    if (!shiftId || isNaN(Number(shiftId))) {
        return NextResponse.json({ error: '無効なシフトIDです。' }, { status: 400 });
    }

    try {
        const { status } = (await request.json()) as PatchBody;

        // ステータスが'confirmed'か'rejected'以外の場合はエラー
        if (status !== 'confirmed' && status !== 'rejected') {
            return NextResponse.json({ error: '無効なステータスです。' }, { status: 400 });
        }

        const sql = `
            UPDATE shifts
            SET status = ?
            WHERE id = ? AND status = 'pending'
        `;

        const [result] = await db.query<OkPacket>(sql, [status, shiftId]);

        // 更新対象が見つからなかった場合（既に処理済みなど）
        if (result.affectedRows === 0) {
            return NextResponse.json({ error: '更新対象のシフトが見つからないか、既に処理済みです。' }, { status: 404 });
        }

        return NextResponse.json({ message: `シフトのステータスを ${status} に更新しました。` });

    } catch (error) {
        console.error(`シフト(ID: ${shiftId})の更新に失敗しました:`, error);
        return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}