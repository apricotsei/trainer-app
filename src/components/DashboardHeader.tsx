'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button'; // パスを修正
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronsUpDown } from 'lucide-react';

// Propsの型定義を追加
type DashboardHeaderProps = {
    trainerName: string;
};

export function DashboardHeader({ trainerName }: DashboardHeaderProps) {
    const { data: session } = useSession();

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
                <Link href="/dashboard">
                    <span className="text-lg font-bold text-gray-800">トレーナーダッシュボード</span>
                </Link>
                <div className="flex items-center space-x-4">
                    {session?.user && (
                        <>
                            <span className="text-sm text-gray-600 hidden sm:inline">
                                こんにちは、{session.user.name}さん
                            </span>
                            
                            {session.user.role === 'admin' && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            管理メニュー
                                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>管理者用</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <Link href="/admin/shift-approval" passHref>
                                            <DropdownMenuItem>シフト承認</DropdownMenuItem>
                                        </Link>
                                        <Link href="/admin/attendance" passHref>
                                            <DropdownMenuItem>勤怠管理</DropdownMenuItem>
                                        </Link>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            <Button onClick={() => signOut({ callbackUrl: '/login' })} size="sm">
                                ログアウト
                            </Button>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}