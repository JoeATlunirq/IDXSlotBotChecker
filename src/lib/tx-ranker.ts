import { CompareResult, RankedRow, TxRecord } from "@/lib/types";

const DEFAULT_SLOT_MS = 400;

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

type RpcAttempt = {
  encoding: "json" | "jsonParsed";
  transactionDetails: "full" | "signatures";
  commitment: "finalized" | "confirmed";
};

type BlockRecord = {
  slot: number;
  txCount: number;
  indexMap: Record<string, number>;
};

export function normalizeSignatureInput(value: string) {
  const stripped = value.trim();
  if (!stripped) {
    return "";
  }

  try {
    const url = new URL(stripped);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const txIndex = pathParts.findIndex((part) => part.toLowerCase() === "tx");
    if (txIndex >= 0 && pathParts[txIndex + 1]) {
      return decodeURIComponent(pathParts[txIndex + 1]).trim();
    }
    throw new Error("Expected a raw transaction signature or a URL like https://solscan.io/tx/<signature>");
  } catch (error) {
    if (stripped.startsWith("http://") || stripped.startsWith("https://")) {
      throw error;
    }
    return stripped;
  }
}

async function callRpc<T>(rpcUrl: string, method: string, params: unknown[], retries = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method,
          params,
        }),
        cache: "no-store",
      });

      const body = (await response.json()) as { result?: T; error?: unknown };
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} during ${method}`);
      }
      if (body.error) {
        throw new Error(`${method} failed: ${JSON.stringify(body.error)}`);
      }
      return body.result as T;
    } catch (error) {
      lastError = error;
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${method} failed with an unknown error`);
}

function asObject(value: JsonValue | undefined): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : null;
}

function asArray(value: JsonValue | undefined): JsonArray | null {
  return Array.isArray(value) ? value : null;
}

function asString(value: JsonValue | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: JsonValue | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function extractAccountKey(entry: JsonValue): string | null {
  if (typeof entry === "string") {
    return entry;
  }

  const object = asObject(entry);
  if (!object) {
    return null;
  }

  return asString(object.pubkey);
}

function extractPrimarySignature(entry: JsonValue): string | null {
  if (typeof entry === "string") {
    return entry;
  }

  const object = asObject(entry);
  if (!object) {
    return null;
  }

  const signature = asString(object.signature);
  if (signature) {
    return signature;
  }

  const signatures = asArray(object.signatures);
  if (signatures && signatures.length > 0) {
    const first = asString(signatures[0]);
    if (first) {
      return first;
    }
  }

  const transaction = asObject(object.transaction);
  if (!transaction) {
    return null;
  }

  const transactionSignatures = asArray(transaction.signatures);
  if (!transactionSignatures || transactionSignatures.length === 0) {
    return null;
  }

  return asString(transactionSignatures[0]);
}

function extractWalletFromTransaction(result: JsonObject) {
  const transaction = asObject(result.transaction);
  const message = transaction ? asObject(transaction.message) : null;
  if (!message) {
    return null;
  }

  for (const keyField of ["accountKeys", "staticAccountKeys"]) {
    const accountKeys = asArray(message[keyField]);
    if (!accountKeys) {
      continue;
    }

    for (const entry of accountKeys) {
      const wallet = extractAccountKey(entry);
      if (wallet) {
        return wallet;
      }
    }
  }

  return null;
}

async function fetchTransactionSummary(rpcUrl: string, signature: string): Promise<TxRecord> {
  let result: JsonObject | null = null;
  let lastError: unknown;

  for (const commitment of ["finalized", "confirmed"] as const) {
    try {
      const rpcResult = await callRpc<JsonObject | null>(rpcUrl, "getTransaction", [
        signature,
        {
          encoding: "json",
          commitment,
          maxSupportedTransactionVersion: 0,
        },
      ]);

      if (rpcResult) {
        result = rpcResult;
        break;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (!result) {
    throw lastError instanceof Error ? lastError : new Error("Transaction not found or unavailable");
  }

  const slot = asNumber(result.slot);
  if (slot === null) {
    throw new Error("Transaction result missing slot");
  }

  return {
    signature,
    wallet: extractWalletFromTransaction(result),
    slot,
    blockTime: asNumber(result.blockTime),
    idx: null,
    slotTxCount: null,
  };
}

function blockSignatureEntries(result: JsonObject | null): JsonArray | null {
  if (!result) {
    return null;
  }

  const transactions = asArray(result.transactions);
  if (transactions) {
    return transactions;
  }

  const signatures = asArray(result.signatures);
  if (signatures) {
    return signatures;
  }

  const nestedBlock = asObject(result.block);
  if (nestedBlock) {
    return blockSignatureEntries(nestedBlock);
  }

  return null;
}

function buildIndexMap(entries: JsonArray) {
  const indexMap: Record<string, number> = {};

  entries.forEach((entry, index) => {
    const signature = extractPrimarySignature(entry);
    if (signature && indexMap[signature] === undefined) {
      indexMap[signature] = index;
    }
  });

  return indexMap;
}

async function fetchBlockSignatures(rpcUrl: string, slot: number, expectedSignatures: Set<string>) {
  const attempts: RpcAttempt[] = [
    { encoding: "json", transactionDetails: "full", commitment: "finalized" },
    { encoding: "json", transactionDetails: "signatures", commitment: "finalized" },
    { encoding: "jsonParsed", transactionDetails: "full", commitment: "finalized" },
    { encoding: "json", transactionDetails: "full", commitment: "confirmed" },
    { encoding: "json", transactionDetails: "signatures", commitment: "confirmed" },
    { encoding: "jsonParsed", transactionDetails: "full", commitment: "confirmed" },
  ];

  let bestResult: BlockRecord | null = null;
  let bestMatchCount = -1;
  let lastError: unknown;

  for (const attempt of attempts) {
    try {
      const result = await callRpc<JsonObject | null>(rpcUrl, "getBlock", [
        slot,
        {
          encoding: attempt.encoding,
          transactionDetails: attempt.transactionDetails,
          rewards: false,
          commitment: attempt.commitment,
          maxSupportedTransactionVersion: 0,
        },
      ]);

      const entries = blockSignatureEntries(result);
      if (!entries) {
        continue;
      }

      const indexMap = buildIndexMap(entries);
      const matchCount = expectedSignatures.size
        ? [...expectedSignatures].filter((signature) => indexMap[signature] !== undefined).length
        : Object.keys(indexMap).length;

      const candidate: BlockRecord = {
        slot,
        txCount: entries.length,
        indexMap,
      };

      if (
        matchCount > bestMatchCount ||
        (matchCount === bestMatchCount && (!bestResult || candidate.txCount > bestResult.txCount))
      ) {
        bestResult = candidate;
        bestMatchCount = matchCount;
      }

      if (expectedSignatures.size > 0 && matchCount === expectedSignatures.size) {
        return candidate;
      }

      if (expectedSignatures.size === 0 && Object.keys(indexMap).length > 0) {
        return candidate;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (bestResult) {
    return bestResult;
  }

  throw lastError instanceof Error ? lastError : new Error(`Unable to fetch block data for slot ${slot}`);
}

function dedupePreserveOrder(values: string[]) {
  const seen = new Set<string>();
  const ordered: string[] = [];

  values.forEach((value) => {
    if (!seen.has(value)) {
      seen.add(value);
      ordered.push(value);
    }
  });

  return ordered;
}

function groupSignaturesBySlot(records: Record<string, TxRecord>) {
  const slotToSignatures = new Map<number, Set<string>>();

  Object.entries(records).forEach(([signature, record]) => {
    const existing = slotToSignatures.get(record.slot) ?? new Set<string>();
    existing.add(signature);
    slotToSignatures.set(record.slot, existing);
  });

  return slotToSignatures;
}

function attachSlotIndexes(records: Record<string, TxRecord>, blockRecords: Map<number, BlockRecord>) {
  Object.values(records).forEach((record) => {
    const block = blockRecords.get(record.slot);
    if (!block) {
      record.idx = null;
      record.slotTxCount = null;
      return;
    }

    record.idx = block.indexMap[record.signature] ?? null;
    record.slotTxCount = block.txCount;
  });
}

function slotFraction(record: TxRecord) {
  if (record.idx === null || record.slotTxCount === null || record.slotTxCount <= 0) {
    return 0.5;
  }

  return (record.idx + 0.5) / record.slotTxCount;
}

function estimateDelayMs(trigger: TxRecord, other: TxRecord, slotMs: number) {
  const slotDelta = other.slot - trigger.slot;
  const fractionalDelta = slotFraction(other) - slotFraction(trigger);
  return (slotDelta + fractionalDelta) * slotMs;
}

function buildRankedRows(trigger: TxRecord, bots: TxRecord[], slotMs: number): RankedRow[] {
  const rows = bots.map((bot, index) => {
    const sameSlotIdxDelta =
      bot.slot === trigger.slot && bot.idx !== null && trigger.idx !== null ? bot.idx - trigger.idx : null;
    const estDelayMs = estimateDelayMs(trigger, bot, slotMs);

    return {
      rank: 0,
      name: `bot_${index + 1}`,
      signature: bot.signature,
      wallet: bot.wallet,
      slot: bot.slot,
      idx: bot.idx,
      slotTxCount: bot.slotTxCount,
      slotDelta: bot.slot - trigger.slot,
      sameSlotIdxDelta,
      estDelayMs,
      absEstDelayMs: Math.abs(estDelayMs),
    } satisfies RankedRow;
  });

  rows.sort((left, right) => {
    if (left.absEstDelayMs !== right.absEstDelayMs) {
      return left.absEstDelayMs - right.absEstDelayMs;
    }

    if (Math.abs(left.slotDelta) !== Math.abs(right.slotDelta)) {
      return Math.abs(left.slotDelta) - Math.abs(right.slotDelta);
    }

    const leftSameSlot = left.sameSlotIdxDelta === null ? Number.POSITIVE_INFINITY : Math.abs(left.sameSlotIdxDelta);
    const rightSameSlot = right.sameSlotIdxDelta === null ? Number.POSITIVE_INFINITY : Math.abs(right.sameSlotIdxDelta);
    return leftSameSlot - rightSameSlot;
  });

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

export async function compareTransactions(input: {
  rpcUrl: string;
  triggerInput: string;
  botInputs: string[];
  slotMs?: number;
}): Promise<CompareResult> {
  const rpcUrl = input.rpcUrl.trim();
  const slotMs = Number.isFinite(input.slotMs) ? Number(input.slotMs) : DEFAULT_SLOT_MS;
  if (!rpcUrl) {
    throw new Error("RPC URL is required.");
  }

  const triggerSignature = normalizeSignatureInput(input.triggerInput);
  if (!triggerSignature) {
    throw new Error("Trigger transaction is required.");
  }

  const normalizedBots = input.botInputs
    .map((value) => normalizeSignatureInput(value))
    .filter((value) => value.length > 0);
  if (normalizedBots.length === 0) {
    throw new Error("At least one bot transaction is required.");
  }

  const signatures = dedupePreserveOrder([triggerSignature, ...normalizedBots]);
  const txRecords: Record<string, TxRecord> = {};
  const txErrors: Record<string, string> = {};

  await Promise.all(
    signatures.map(async (signature) => {
      try {
        txRecords[signature] = await fetchTransactionSummary(rpcUrl, signature);
      } catch (error) {
        txErrors[signature] = error instanceof Error ? error.message : "Unknown transaction fetch error";
      }
    }),
  );

  const triggerRecord = txRecords[triggerSignature];
  if (!triggerRecord) {
    throw new Error(txErrors[triggerSignature] ?? "Trigger transaction could not be fetched.");
  }

  const survivingBotSignatures = normalizedBots.filter(
    (signature) => signature !== triggerSignature && txRecords[signature],
  );
  if (survivingBotSignatures.length === 0) {
    throw new Error("No bot transactions could be fetched.");
  }

  const slotToSignatures = groupSignaturesBySlot(txRecords);
  const blockRecords = new Map<number, BlockRecord>();
  const blockErrors: Record<string, string> = {};

  await Promise.all(
    [...slotToSignatures.entries()].map(async ([slot, expectedSignatures]) => {
      try {
        const blockRecord = await fetchBlockSignatures(rpcUrl, slot, expectedSignatures);
        blockRecords.set(slot, blockRecord);
      } catch (error) {
        blockErrors[String(slot)] = error instanceof Error ? error.message : "Unknown block fetch error";
      }
    }),
  );

  attachSlotIndexes(txRecords, blockRecords);

  const missingIdxBySlot: Record<string, string[]> = {};
  Object.values(txRecords).forEach((record) => {
    if (record.idx === null) {
      const key = String(record.slot);
      missingIdxBySlot[key] = [...(missingIdxBySlot[key] ?? []), record.signature];
    }
  });

  const rankedBots = buildRankedRows(
    txRecords[triggerSignature],
    survivingBotSignatures.map((signature) => txRecords[signature]),
    slotMs,
  );

  const skippedBotErrors: Record<string, string> = {};
  normalizedBots.forEach((signature) => {
    if (signature !== triggerSignature && txErrors[signature]) {
      skippedBotErrors[signature] = txErrors[signature];
    }
  });

  return {
    rpcUrlUsed: rpcUrl,
    slotMs,
    trigger: txRecords[triggerSignature],
    rankedBots,
    skippedBotErrors,
    blockErrors,
    missingIdxBySlot,
  };
}
