import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

export async function middleware(req) {
  const session = await getUser(req);

  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}
