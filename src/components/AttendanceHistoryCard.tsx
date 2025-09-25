'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, formatDistanceStrict } from 'date-fns';
import { ja } from 'date-fns/locale';
import { History, Loader2 } from 'lucide-react';

type AttendanceRecord = {
    id: number;
    clock_in_time: string;
    clock_out_time: string | null;
};

export function AttendanceHistoryCard() {
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch('/api/attendance/history');
                if (!response.ok) {
                    throw new Error('勤怠履歴の取得に失敗しました。');
                }
                const data = await response.json();
                setHistory(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // 勤務時間を計算する関数
    const calculateDuration = (start: string, end: string | null): string => {
        if (!end) return '出勤中';
        const startTime = new Date(start);
        const endTime = new Date(end);
        // 分単位で勤務時間を計算し、日本語で表示
        return formatDistanceStrict(endTime, startTime, { locale: ja, unit: 'minute' });
    };

    return (
        <Card className="rounded-2xl shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-700 flex items-center">
                    <History className="h-6 w-6 text-gray-500 mr-2" />
                    勤怠履歴
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading && <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin"/></div>}
                {error && <p className="text-red-500">エラー: {error}</p>}
                {!loading && !error && (
                    <div className="max-h-96 overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-gray-50 z-10">
                                <TableRow>
                                    <TableHead>日付</TableHead>
                                    <TableHead>出勤</TableHead>
                                    <TableHead>退勤</TableHead>
                                    <TableHead className="text-right">勤務時間</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.length > 0 ? (
                                    history.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(record.clock_in_time), 'M月d日(E)', { locale: ja })}
                                            </TableCell>
                                            <TableCell>{format(new Date(record.clock_in_time), 'HH:mm')}</TableCell>
                                            <TableCell>
                                                {record.clock_out_time ? format(new Date(record.clock_out_time), 'HH:mm') : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {calculateDuration(record.clock_in_time, record.clock_out_time)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            勤怠記録はありません。
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}