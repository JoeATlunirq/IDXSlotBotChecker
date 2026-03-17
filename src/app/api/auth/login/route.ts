import { NextRequest, NextResponse } from "next/server";

import { createSessionCookie, getAuthConfigurationError, isPasswordValid } from "@/lib/site-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const configurationError = getAuthConfigurationError();
  if (configurationError) {
    return NextResponse.json({ error: configurationError }, { status: 500 });
  }

  try {
    const body = (await request.json()) as { password?: string };
    const password = typeof body.password === "string" ? body.password : "";

    if (!password || !isPasswordValid(password)) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(createSessionCookie());
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
