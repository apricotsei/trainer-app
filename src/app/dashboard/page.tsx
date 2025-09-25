import { db } from '@/lib/db';
import { DashboardClient } from '@/components/DashboardClient';
import { RowDataPacket } from 'mysql2';
import { Trainer, Shift } from '@/types/db'; 
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

// DBから特定のトレーナーのシフト一覧を取得する関数
async function getShiftsByTrainerId(trainerId: number): Promise<Shift[]> {
    try {
        const sql = `
            SELECT id, trainer_id, start_time, end_time, status 
            FROM shifts 
            WHERE trainer_id = ? 
            ORDER BY start_time ASC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [trainerId]);

        // DBから取得したDateオブジェクトを、クライアントコンポーネントに渡せるISO文字列形式に変換する
        const shifts = rows.map(row => ({
            ...row,
            start_time: new Date(row.start_time).toISOString(),
            end_time: new Date(row.end_time).toISOString(),
        })) as Shift[];
        
        return shifts;

    } catch (error) {
        console.error('Failed to fetch shifts:', error);
        // エラーが発生した場合は空の配列を返す
        return [];
    }
}

// DBから特定のトレーナー情報を取得する関数 (新規追加)
async function getTrainerById(trainerId: number): Promise<Trainer | null> {
    try {
        const sql = `SELECT id, name FROM trainers WHERE id = ?`;
        const [rows] = await db.query<RowDataPacket[]>(sql, [trainerId]);
        
        if (rows.length === 0) {
            return null;
        }
        
        return rows[0] as Trainer;

    } catch (error) {
        console.error('Failed to fetch trainer:', error);
        throw new Error('Failed to fetch trainer data.');
    }
}

export default async function DashboardPage() {
    // サーバーサイドでセッション情報を取得します
    const session = await getServerSession(authOptions);

    // セッションがない、またはユーザーIDがなければログインページにリダイレクトします
    // (Middlewareでも保護していますが、二重でチェックするのが安全です)
    if (!session?.user?.id) {
        redirect('/login');
    }

    const trainerId = parseInt(session.user.id, 10);

    try {
        // トレーナー情報とシフト情報を並行して取得
        const [trainer, initialShifts] = await Promise.all([
            getTrainerById(trainerId),
            getShiftsByTrainerId(trainerId)
        ]);

        if (!trainer) {
            return (
                <div className="flex justify-center items-center h-screen">
                    <p className="text-red-500">トレーナー情報が見つかりませんでした。</p>
                </div>
            );
        }

        return (
            <DashboardClient
                trainerId={trainer.id}
                trainerName={trainer.name}
                initialShifts={initialShifts}
            />
        );

    } catch (error) {
        console.error(error);
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-red-500">データの読み込み中にエラーが発生しました。</p>
            </div>
        );
    }
}