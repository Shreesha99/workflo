import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

export async function proxy() {
  // ❗ getUser already knows how to read cookies internally
  const session = await getUser();

  // We must get the current request URL using "nextUrl"
  const url = new URL(globalThis.location?.href || "http://localhost:3000");

  // Protect dashboard route
  if (!session && url.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/login", url.origin));
  }

  return NextResponse.next();
}
