import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // 新しい共有ファイルからインポート

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };