import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";

async function handler(request: Request, context: unknown) {
  const authHandler = NextAuth(await getAuthOptions());
  return authHandler(request, context);
}

export { handler as GET, handler as POST };
