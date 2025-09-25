import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2'; // RowDataPacketをインポート

// クエリ結果の型を定義
interface TimeResult extends RowDataPacket {
    now: string;
    }

    export async function GET() {
    try {
        // db.queryに型を教える
        const [rows] = await db.query<TimeResult[]>('SELECT NOW() as now;');

        // 取得した結果の最初の要素にアクセス
        const currentTime = rows[0]?.now;

        // 成功した場合、取得した時刻をJSONで返す
        return NextResponse.json({
        message: 'Database connection successful!',
        time: currentTime,
        });
    } catch (error) {
        // エラーが発生した場合、コンソールにエラーログを出力
        console.error('Database connection failed:', error);

        // 500 Internal Server Errorを返す
        return NextResponse.json(
        { error: 'Failed to connect to the database.' },
        { status: 500 }
        );
    }
}