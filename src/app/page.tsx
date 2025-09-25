import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">トレーナーアプリへようこそ</CardTitle>
          <CardDescription className="pt-2">
            ログインまたは新規登録して、ダッシュボードに進んでください。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4 p-6">
          <Link href="/login" passHref>
            <Button className="w-full" size="lg">ログイン</Button>
          </Link>
          <Link href="/register" passHref>
            <Button variant="outline" className="w-full" size="lg">新規登録</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
