'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, formatDistanceStrict, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Users, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

type AttendanceRecord = {
    id: number;
    trainer_name: string;
    clock_in_time: string;
    clock_out_time: string | null;
};

export default function AdminAttendancePage() {
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    });

    useEffect(() => {
        const fetchHistory = async () => {
            if (!date?.from || !date?.to) return;

            setLoading(true);
            setError(null);
            try {
                const fromISO = date.from.toISOString().split('T')[0];
                const toISO = date.to.toISOString().split('T')[0];
                const response = await fetch(`/api/admin/attendances?from=${fromISO}&to=${toISO}`);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '勤怠履歴の取得に失敗しました。');
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
    }, [date]);

    const calculateDuration = (start: string, end: string | null): string => {
        if (!end) return '出勤中';
        return formatDistanceStrict(new Date(end), new Date(start), { locale: ja, unit: 'minute' });
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold flex items-center">
                                <Users className="mr-2 h-6 w-6" />
                                勤怠管理
                            </CardTitle>
                            <CardDescription>全トレーナーの勤怠状況です。</CardDescription>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className="w-full sm:w-auto mt-4 sm:mt-0"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "M/d")} - {format(date.to, "M/d")}
                                            </>
                                        ) : (
                                            format(date.from, "M/d")
                                        )
                                    ) : (
                                        <span>日付を選択</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            {/* ★ 修正点: PopoverContentの中に、背景色と文字色を指定したdivを追加 */}
                            <PopoverContent className="w-auto p-0 z-50" align="end">
                                <div className="rounded-md border bg-slate-800 text-slate-50">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                        locale={ja}
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading && <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin"/></div>}
                    {error && <p className="text-red-500 text-center py-4">エラー: {error}</p>}
                    {!loading && !error && (
                         <div className="max-h-[60vh] overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-background">
                                    <TableRow>
                                        <TableHead>トレーナー名</TableHead>
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
                                                <TableCell className="font-medium">{record.trainer_name}</TableCell>
                                                <TableCell>{format(new Date(record.clock_in_time), 'M/d(E)', { locale: ja })}</TableCell>
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
                                            <TableCell colSpan={5} className="text-center h-24">
                                                指定された期間の勤怠記録はありません。
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}