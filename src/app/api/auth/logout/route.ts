import { NextResponse } from "next/server";

import { createClearedSessionCookie } from "@/lib/site-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(createClearedSessionCookie());
  return response;
}
