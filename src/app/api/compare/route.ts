import { NextRequest, NextResponse } from "next/server";

import { compareTransactions } from "@/lib/tx-ranker";
import { CompareRequestPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_RPC_URL = process.env.SERVER_DEFAULT_RPC_URL || process.env.NEXT_PUBLIC_DEFAULT_RPC_URL || "";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CompareRequestPayload;
    const result = await compareTransactions({
      rpcUrl: (body.rpcUrl || DEFAULT_RPC_URL).trim(),
      triggerInput: body.trigger,
      botInputs: body.bots,
      slotMs: body.slotMs,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
