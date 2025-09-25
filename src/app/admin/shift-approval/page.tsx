'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft, Loader2 } from 'lucide-react';

// 型定義
type PendingShift = {
    id: number;
    start_time: string;
    end_time: string;
    status: 'pending';
};

type TrainerWithShifts = {
    trainer_id: number;
    trainer_name: string;
    shifts: PendingShift[];
};

export default function ShiftApprovalPage() {
    const [trainersWithShifts, setTrainersWithShifts] = useState<TrainerWithShifts[]>([]);
    const [selectedTrainer, setSelectedTrainer] = useState<TrainerWithShifts | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null); // ★ 処理中のシフトIDを管理

    // 申請中シフトを取得する関数 (useCallbackでメモ化)
    const fetchPendingShifts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/shifts');
            if (!response.ok) {
                throw new Error('シフト情報の取得に失敗しました。');
            }
            const data: TrainerWithShifts[] = await response.json();
            setTrainersWithShifts(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingShifts();
    }, [fetchPendingShifts]);

    // ★ シフトのステータスを更新する共通関数
    const handleUpdateShiftStatus = async (shiftId: number, status: 'confirmed' | 'rejected') => {
        setProcessingId(shiftId);
        try {
            const response = await fetch(`/api/admin/shifts/${shiftId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'ステータスの更新に失敗しました。');
            }
            
            // 更新成功後、最新のリストを再取得
            await fetchPendingShifts();
            // もし選択中のトレーナーのシフトがなくなったら、トレーナー選択画面に戻る
            const updatedTrainer = trainersWithShifts.find(t => t.trainer_id === selectedTrainer?.trainer_id);
            if (updatedTrainer && updatedTrainer.shifts.length === 1) {
                 setSelectedTrainer(null);
            } else {
                 // 選択中のトレーナー情報を更新
                 const refreshedTrainer = await (await fetch('/api/admin/shifts')).json();
                 const currentTrainer = refreshedTrainer.find((t: TrainerWithShifts) => t.trainer_id === selectedTrainer?.trainer_id);
                 setSelectedTrainer(currentTrainer || null);
            }

        } catch (err) {
            alert((err as Error).message);
        } finally {
            setProcessingId(null);
        }
    };
    
    if (loading) return <div className="container mx-auto p-8 flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <div className="container mx-auto p-8"><p className="text-red-500">エラー: {error}</p></div>;

    if (selectedTrainer) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <Button variant="ghost" onClick={() => setSelectedTrainer(null)} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    トレーナー選択に戻る
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">{selectedTrainer.trainer_name} の申請中シフト</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                           <TableHeader>
                                <TableRow>
                                    <TableHead>日付</TableHead>
                                    <TableHead>時間</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedTrainer.shifts.map((shift) => (
                                    <TableRow key={shift.id}>
                                        <TableCell>{format(new Date(shift.start_time), 'M月d日 (E)', { locale: ja })}</TableCell>
                                        <TableCell>{`${format(new Date(shift.start_time), 'HH:mm')} - ${format(new Date(shift.end_time), 'HH:mm')}`}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => handleUpdateShiftStatus(shift.id, 'rejected')} disabled={processingId === shift.id}>
                                                {processingId === shift.id ? <Loader2 className="h-4 w-4 animate-spin" /> : '拒否'}
                                            </Button>
                                            <Button size="sm" onClick={() => handleUpdateShiftStatus(shift.id, 'confirmed')} disabled={processingId === shift.id}>
                                                 {processingId === shift.id ? <Loader2 className="h-4 w-4 animate-spin" /> : '承認'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">シフト承認</CardTitle>
                    <CardDescription>シフト申請があるトレーナーを選択してください。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {trainersWithShifts.length > 0 ? (
                        trainersWithShifts.map((trainer) => (
                            <Button
                                key={trainer.trainer_id}
                                variant="outline"
                                className="w-full justify-between"
                                onClick={() => setSelectedTrainer(trainer)}
                            >
                                {trainer.trainer_name}
                                <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                                    {trainer.shifts.length}件
                                </span>
                            </Button>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground pt-4">現在、承認待ちのシフトはありません。</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}