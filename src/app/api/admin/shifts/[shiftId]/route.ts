import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import type { ResultSetHeader } from 'mysql2/promise';

type PatchBody = {
    status: 'confirmed' | 'rejected';
}

// Next.jsのルートハンドラの引数の型を、より明確なインターフェースとして分離
// これにより、Vercelのビルドシステムが型を正しく解釈できるようになる
interface RouteContext {
    params: {
        shiftId: string;
    }
}

export async function PATCH(
    request: NextRequest, 
    context: RouteContext
) {
    const { shiftId } = context.params;

    if (!shiftId || isNaN(Number(shiftId))) {
        return NextResponse.json({ error: '無効なシフトIDです。' }, { status: 400 });
    }

    try {
        // インラインの型指定の代わりに、定義した PatchBody 型を使用
        const body: PatchBody = await request.json();
        const { status } = body;

        if (status !== 'confirmed' && status !== 'rejected') {
            return NextResponse.json({ error: '無効なステータスです。' }, { status: 400 });
        }

        const sql = `
            UPDATE shifts
            SET status = ?
            WHERE id = ? AND status = 'pending'
        `;
        
        // ResultSetHeader を使用するように更新
        const [result] = await db.query<ResultSetHeader>(sql, [status, shiftId]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: '更新対象のシフトが見つからないか、既に処理済みです。' }, { status: 404 });
        }

        return NextResponse.json({ message: `シフトのステータスを ${status} に更新しました。` });

    } catch (error) {
        console.error(`シフト(ID: ${shiftId})の更新に失敗しました:`, error);
        return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}