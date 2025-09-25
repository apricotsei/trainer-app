// types/db.ts

/**
 * シフトのステータス
 * 'pending': トレーナーが提出しただけの状態
 * 'confirmed': 管理者が承認した状態
 * 'cancelled': キャンセルされた状態
 */
export type ShiftStatus = 'pending' | 'confirmed' | 'cancelled';

/**
 * shiftsテーブルのレコードに対応する型
 */
export interface Shift {
    id: number;
    trainer_id: number; // 外部キー: trainersテーブルのID
    start_time: string;
    end_time: string;
    status: ShiftStatus;
    created_at?: string; // ? は省略可能なプロパティを示す
    updated_at?: string;
}

/**
 * trainersテーブルのレコードに対応する型
 */
export interface Trainer {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}