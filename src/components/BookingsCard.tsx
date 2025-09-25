'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge'; // Badgeも必要になる可能性があります
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarCheck } from 'lucide-react';

// Bookingの型を定義
type Booking = {
    id: number;
    session_start_time: string;
    session_end_time: string;
    status: string;
    customer_name: string;
};

type BookingsCardProps = {
    trainerId: number;
};

export function BookingsCard({ trainerId }: BookingsCardProps) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                // APIにtrainerIdをクエリパラメータとして渡す
                const response = await fetch(`/api/booking?trainerId=${trainerId}`);
                if (!response.ok) {
                    throw new Error('予約情報の取得に失敗しました。');
                }
                const data: Booking[] = await response.json();
                setBookings(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [trainerId]);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'default';
            case 'completed':
                return 'secondary';
            case 'cancelled':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <Card className="md:col-span-2 rounded-2xl shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-700 flex items-center">
                    <CalendarCheck className="h-6 w-6 text-blue-500 mr-2" />
                    予約一覧
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading && <p>読み込み中...</p>}
                {error && <p className="text-red-500">エラー: {error}</p>}
                {!loading && !error && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>日時</TableHead>
                                <TableHead>お客様名</TableHead>
                                <TableHead className="text-right">ステータス</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings.length > 0 ? (
                                bookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {format(new Date(booking.session_start_time), 'M月d日(E)', { locale: ja })}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {format(new Date(booking.session_start_time), 'HH:mm')} - {format(new Date(booking.session_end_time), 'HH:mm')}
                                            </div>
                                        </TableCell>
                                        <TableCell>{booking.customer_name}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={getStatusVariant(booking.status)}>
                                                {booking.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">
                                        現在、予約はありません。
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}