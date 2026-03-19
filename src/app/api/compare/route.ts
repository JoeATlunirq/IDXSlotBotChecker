import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getAuthConfigurationError, hasValidSessionCookieValue } from "@/lib/site-auth";
import { compareTransactions } from "@/lib/tx-ranker";
import { CompareRequestPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVER_RPC_URL = process.env.SERVER_DEFAULT_RPC_URL || "";

export async function POST(request: NextRequest) {
  const configurationError = getAuthConfigurationError();
  if (configurationError) {
    return NextResponse.json({ error: configurationError }, { status: 500 });
  }

  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!hasValidSessionCookieValue(sessionCookie)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!SERVER_RPC_URL.trim()) {
    return NextResponse.json({ error: "Server is not configured." }, { status: 500 });
  }

  try {
    const body = (await request.json()) as CompareRequestPayload;
    const result = await compareTransactions({
      rpcUrl: SERVER_RPC_URL.trim(),
      triggerInput: body.trigger,
      botInputs: body.bots,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
