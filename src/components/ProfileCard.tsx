'use client';

import { UserCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ProfileCardProps = {
    trainerId: number;
    trainerName: string;
};

export function ProfileCard({ trainerId, trainerName }: ProfileCardProps) {
    return (
        <Card className="rounded-2xl shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-700 flex items-center">
                    <UserCircle2 className="h-6 w-6 text-blue-500 mr-2" /> プロフィール
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <p className="text-lg text-gray-800 font-semibold">{trainerName}</p>
                    <p className="text-sm text-gray-500">トレーナーID: T-{trainerId.toString().padStart(5, '0')}</p>
                </div>
            </CardContent>
        </Card>
    );
}