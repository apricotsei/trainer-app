'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Clock as ClockIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type AttendanceStatus = 'clocked_in' | 'clocked_out' | 'loading' | 'error';

type AttendanceCardProps = {
    trainerId: number;
};

export function AttendanceCard({ trainerId }: AttendanceCardProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('loading');
    const [clockInTime, setClockInTime] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 現在の勤怠状況を取得する関数
    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch('/api/attendance/status');
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '勤怠状況の取得に失敗しました。');
            }
            setAttendanceStatus(data.status);
            if (data.status === 'clocked_in') {
                setClockInTime(data.clockInTime);
            }
        } catch (err) {
            setError((err as Error).message);
            setAttendanceStatus('error');
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [fetchStatus]);

    // 打刻処理を行う関数
    const handleClockAction = async (action: 'clock_in' | 'clock_out') => {
        setIsProcessing(true);
        setError(null);
        try {
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '打刻処理に失敗しました。');
            }
            // 成功後、最新の勤怠状況を再取得
            await fetchStatus();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card className="rounded-2xl shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-700 flex items-center">
                    <ClockIcon className="h-6 w-6 text-indigo-500 mr-2" /> 勤怠情報
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-lg mb-2 text-gray-600">
                    <span className="font-semibold">現在の時刻:</span> {format(currentTime, 'HH:mm:ss')}
                </p>
                {attendanceStatus === 'clocked_in' && clockInTime && (
                    <p className="text-sm text-green-600">
                        出勤時刻: {format(new Date(clockInTime), 'HH:mm:ss')}
                    </p>
                )}
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                
                <div className="flex gap-4 mt-4">
                    <Button 
                        className="flex-1"
                        onClick={() => handleClockAction('clock_in')}
                        disabled={isProcessing || attendanceStatus !== 'clocked_out'}
                    >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : '出勤'}
                    </Button>
                    <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleClockAction('clock_out')}
                        disabled={isProcessing || attendanceStatus !== 'clocked_in'}
                    >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : '退勤'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
