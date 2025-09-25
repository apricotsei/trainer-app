import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

    // --- ログイン必須ページの保護 ---
    // /dashboard または /admin で始まるページにアクセスしようとしているが、
    // ログインしていない (tokenがない) 場合はログインページにリダイレクト
    if ((pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) && !token) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // --- 管理者ページの保護 ---
    // /admin で始まるページにアクセスしようとしているが、
    // 役割が 'admin' ではない場合はダッシュボードにリダイレクト
    if (pathname.startsWith('/admin') && token && token.role !== 'admin') {
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    // 上記の条件に当てはまらない場合は、アクセスを許可
    return NextResponse.next();
}

// どのパスでこのMiddlewareを実行するかを指定
export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*'],
};