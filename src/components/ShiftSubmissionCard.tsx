'use client';

import { useState, useMemo } from 'react';
import { set } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar as ShiftIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shift } from '@/types/db';

// Dateオブジェクトを 'YYYY-MM-DD HH:MM:SS' 形式の文字列に変換するヘルパー関数
function formatDateToLocalMySQL(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


// このコンポーネントが受け取るPropsの型定義
type ShiftSubmissionCardProps = {
    trainerId: number;
    onShiftSubmit: (newShift: Shift) => void;
};

export function ShiftSubmissionCard({ trainerId, onShiftSubmit }: ShiftSubmissionCardProps) {
    // --- State Management ---
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedStartTime, setSelectedStartTime] = useState<number | null>(null);
    const [selectedEndTime, setSelectedEndTime] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMonth, setModalMonth] = useState(new Date());

    const availableHours = useMemo(() => Array.from({ length: 14 }, (_, i) => i + 9), []);
    const availableEndHours = useMemo(() => {
        if (selectedStartTime === null) return [];
        return availableHours.filter(hour => hour > selectedStartTime);
    }, [selectedStartTime, availableHours]);

    // --- Shift Submission Logic ---
    const handleShiftSubmit = async () => {
        if (!selectedDate || selectedStartTime === null || selectedEndTime === null) {
            console.error('日付、開始時間、終了時間を選択してください。');
            return;
        }
        setIsSubmitting(true);
        
        const startTime = set(selectedDate, { hours: selectedStartTime, minutes: 0, seconds: 0, milliseconds: 0 });
        const endTime = set(selectedDate, { hours: selectedEndTime, minutes: 0, seconds: 0, milliseconds: 0 });

        // toISOString() の代わりに、新しいフォーマット関数を使用
        const shiftData = {
            trainer_id: trainerId,
            start_time: formatDateToLocalMySQL(startTime),
            end_time: formatDateToLocalMySQL(endTime),
        };
        
        try {
            const response = await fetch('/api/shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(shiftData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'シフトの提出に失敗しました。');
            }

            // APIからのレスポンスの型を明示的に指定
            const responseData = await response.json();
            const newShift: Shift = {
                ...responseData.shift,
                start_time: responseData.shift.start_time,
                end_time: responseData.shift.end_time,
            };
            
            onShiftSubmit(newShift);
            
            setSelectedStartTime(null);
            setSelectedEndTime(null);
            setIsModalOpen(false);

        } catch (err) {
            console.error(err);
            alert((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="rounded-2xl shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-700 flex items-center">
                    <ShiftIcon className="h-6 w-6 text-purple-500 mr-2" /> シフト提出
                </CardTitle>
                <CardDescription className="pt-2 text-gray-600">次回のシフトを提出できます。</CardDescription>
            </CardHeader>
            <CardContent>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full px-6 py-3 bg-purple-500 text-white font-bold rounded-full shadow hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition ease-in-out duration-150">
                            シフトを提出する
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl w-full rounded-2xl bg-gray-800 border-gray-700 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-white">シフトを提出</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                            <div className="space-y-3">
                                <h4 className="text-lg font-semibold text-white">日付を選択</h4>
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    month={modalMonth}
                                    onMonthChange={setModalMonth}
                                    locale={ja}
                                    disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    className="rounded-md border bg-slate-50 text-slate-900"
                                />
                            </div>
                            <div className="flex flex-col space-y-4">
                                <h4 className="text-lg font-semibold text-white">時間を選択</h4>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">開始時間</label>
                                    <Select
                                        value={selectedStartTime?.toString()}
                                        onValueChange={(value: string) => {
                                            const time = parseInt(value, 10);
                                            setSelectedStartTime(time);
                                            if (selectedEndTime !== null && time >= selectedEndTime) {
                                                setSelectedEndTime(null);
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white focus:ring-purple-500">
                                            <SelectValue placeholder="選択..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 text-white border-gray-700">
                                            {availableHours.map((hour) => (
                                                <SelectItem key={`start-${hour}`} value={hour.toString()} className="focus:bg-purple-600">
                                                    {hour}:00
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">終了時間</label>
                                    <Select
                                        value={selectedEndTime?.toString()}
                                        onValueChange={(value: string) => setSelectedEndTime(parseInt(value, 10))}
                                        disabled={selectedStartTime === null}
                                    >
                                        <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white focus:ring-purple-500">
                                            <SelectValue placeholder="選択..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 text-white border-ray-700">
                                            {availableEndHours.map((hour) => (
                                                <SelectItem key={`end-${hour}`} value={hour.toString()} className="focus:bg-purple-600">
                                                    {hour}:00
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleShiftSubmit}
                                disabled={isSubmitting || selectedStartTime === null || selectedEndTime === null}
                                className="w-full mt-2 px-4 py-3 bg-purple-600 text-white font-bold rounded-md shadow-sm hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition ease-in-out duration-150"
                            >
                                {isSubmitting ? '提出中...' : 'この内容で登録'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}