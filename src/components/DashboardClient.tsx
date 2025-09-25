'use client';

import { useState } from 'react';

// Custom Components
import { DashboardHeader } from '@/components/DashboardHeader';
import { ProfileCard } from '@/components/ProfileCard';
import { AttendanceCard } from '@/components/AttendanceCard';
import { ShiftSubmissionCard } from '@/components/ShiftSubmissionCard';
import { SubmittedShiftsList } from '@/components/SubmittedShiftsList';
import { BookingsCard } from '@/components/BookingsCard';

// 型定義
import { Shift } from '@/types/db';
import { AttendanceHistoryCard } from './AttendanceHistoryCard';

// このコンポーネントが受け取るPropsの型定義
type DashboardClientProps = {
    trainerId: number;
    trainerName: string;
    initialShifts: Shift[];
};

export function DashboardClient({ trainerId, trainerName, initialShifts }: DashboardClientProps) {
    const [shifts, setShifts] = useState<Shift[]>(initialShifts || []);

    const handleShiftSubmitted = (newShift: Shift) => {
        setShifts(prevShifts => 
            [...prevShifts, newShift].sort((a, b) => 
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            )
        );
    };
    
    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
            <DashboardHeader trainerName={trainerName} />

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mt-6">
                {/* 左側のカラム */}
                <div className="lg:col-span-1 space-y-8">
                    <ProfileCard trainerId={trainerId} trainerName={trainerName} />
                    {/* ★ AttendanceCardにtrainerIdを渡す */}
                    <AttendanceCard trainerId={trainerId} />
                    <ShiftSubmissionCard trainerId={trainerId} onShiftSubmit={handleShiftSubmitted} />
                </div>

                {/* 右側のカラム */}
                <div className="lg:col-span-2 space-y-8">
                    <BookingsCard trainerId={trainerId} />
                    <SubmittedShiftsList shifts={shifts} />
                    <AttendanceHistoryCard/>
                </div>
            </main>
        </div>
    );
}