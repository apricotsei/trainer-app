'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { BookOpen as ScheduleIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shift } from '@/types/db'; // types/db.tsからShift型をインポート

type SubmittedShiftsListProps = {
    shifts: Shift[];
};

// ステータスに応じて表示テキストと色を返すヘルパー関数
const getStatusAppearance = (status: Shift['status']) => {
    switch (status) {
        case 'pending':
            return { text: '申請中', color: 'bg-yellow-500' };
        case 'confirmed':
            return { text: '確定', color: 'bg-emerald-500' };
        case 'cancelled':
            return { text: 'キャンセル', color: 'bg-slate-400' };
        default:
            // statusが網羅されていない場合に備える
            const exhaustiveCheck: never = status;
            return { text: '不明', color: 'bg-gray-400' };
    }
};

export function SubmittedShiftsList({ shifts }: SubmittedShiftsListProps) {
    return (
        <Card className="rounded-2xl shadow-lg">
            <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-700 flex items-center">
                        <ScheduleIcon className="h-6 w-6 text-teal-500 mr-2" /> 提出済みシフト
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {shifts.length > 0 ? (
                            shifts.map(shift => {
                                const { text, color } = getStatusAppearance(shift.status);
                                return (
                                    <li key={shift.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-lg text-gray-800">{format(new Date(shift.start_time), 'M月d日 (E)', {locale: ja})}</p>
                                            <p className="text-sm text-gray-500">
                                                {format(new Date(shift.start_time), 'HH:mm')} ~ {format(new Date(shift.end_time), 'HH:mm')}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 text-sm font-bold rounded-full text-white ${color}`}>
                                            {text}
                                        </span>
                                    </li>
                                );
                            })
                        ) : (
                            <li className="text-center text-gray-500 py-4">提出済みのシフトはありません。</li>
                        )}
                    </ul>
            </CardContent>
        </Card>
    );
}