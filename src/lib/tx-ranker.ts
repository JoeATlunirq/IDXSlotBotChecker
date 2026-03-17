import { CompareResult, RankedRow, TxRecord } from "@/lib/types";

const DEFAULT_SLOT_MS = 400;
const LAMPORTS_PER_SOL = 1_000_000_000;
const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_CHAR_TO_VALUE = Object.fromEntries(
  [...BASE58_ALPHABET].map((char, index) => [char, index]),
) as Record<string, number>;
const LANDER_TIP_ACCOUNTS = new Set<string>([
  "astrazznxsGUhWShqgNtAdfrzP2G83DzcWVJDxwV9bF",
  "astra4uejePWneqNaJKuFFA8oonqCE1sqF6b45kDMZm",
  "astra9xWY93QyfG6yM8zwsKsRodscjQ2uU2HKNL5prk",
  "astraRVUuTHjpwEVvNBeQEgwYx9w9CFyfxjYoobCZhL",
  "astraEJ2fEj8Xmy6KLG7B3VfbKfsHXhHrNdCQx7iGJK",
  "astraubkDw81n4LuutzSQ8uzHCv4BhPVhfvTcYv8SKC",
  "astraZW5GLFefxNPAatceHhYjfA1ciq9gvfEg2S47xk",
  "astrawVNP4xDBKT7rAdxrLYiTSTdqtUr63fSMduivXK",
  "FjmZZrFvhnqqb9ThCuMVnENaM3JGVuGWNyCAxRJcFpg9",
  "6No2i3aawzHsjtThw81iq1EXPJN6rh8eSJCLaYZfKDTG",
  "A9cWowVAiHe9pJfKAj3TJiN9VpbzMUq6E4kEvf5mUT22",
  "Gywj98ophM7GmkDdaWs4isqZnDdFCW7B46TXmKfvyqSm",
  "68Pwb4jS7eZATjDfhmTXgRJjCiZmw1L7Huy4HNpnxJ3o",
  "4ABhJh5rZPjv63RBJBuyWzBK3g9gWMUQdTZP2kiW31V9",
  "B2M4NG5eyZp5SBQrSdtemzk5TqVuaWGQnowGaCBt8GyM",
  "5jA59cXMKQqZAVdtopv8q3yyw9SYfiE3vUCbt7p8MfVf",
  "5YktoWygr1Bp9wiS1xtMtUki1PeYuuzuCF98tqwYxf61",
  "295Avbam4qGShBYK7E9H5Ldew4B3WyJGmgmXfiWdeeyV",
  "EDi4rSy2LZgKJX74mbLTFk4mxoTgT6F7HxxzG2HBAFyK",
  "BnGKHAC386n4Qmv9xtpBVbRaUTKixjBe3oagkPFKtoy6",
  "Dd7K2Fp7AtoN8xCghKDRmyqr5U169t48Tw5fEd3wT9mq",
  "AP6qExwrbRgBAVaehg4b5xHENX815sMabtBzUzVB4v8S",
  "HWEoBxYs7ssKuudEjzjmpfJVX7Dvi7wescFsVx2L5yoY",
  "95cfoy472fcQHaw4tPGBTKpn6ZQnfEPfBgDQx6gcRmRg",
  "3UQUKjhMKaY2S6bjcQD6yHB7utcZt5bfarRCmctpRtUd",
  "FogxVNs6Mm2w9rnGL1vkARSwJxvLE8mujTv3LK8RnUhF",
  "FLaShB3iXXTWE1vu9wQsChUKq3HFtpMAhb8kAh1pf1wi",
  "FLashhsorBmM9dLpuq6qATawcpqk1Y2aqaZfkd48iT3W",
  "FLaSHJNm5dWYzEgnHJWWJP5ccu128Mu61NJLxUf7mUXU",
  "FLaSHR4Vv7sttd6TyDF4yR1bJyAxRwWKbohDytEMu3wL",
  "FLASHRzANfcAKDuQ3RXv9hbkBy4WVEKDzoAgxJ56DiE4",
  "FLasHstqx11M8W56zrSEqkCyhMCCpr6ze6Mjdvqope5s",
  "FLAShWTjcweNT4NSotpjpxAkwxUr2we3eXQGhpTVzRwy",
  "FLasHXTqrbNvpWFB6grN47HGZfK6pze9HLNTgbukfPSk",
  "FLAshyAyBcKb39KPxSzXcepiS8iDYUhDGwJcJDPX4g2B",
  "FLAsHZTRcf3Dy1APaz6j74ebdMC6Xx4g6i9YxjyrDybR",
  "4ACfpUFoaSD9bfPdeu6DBt89gB6ENTeHBXCAi87NhDEE",
  "D2L6yPZ2FmmmTKPgzaMKdhu6EWZcTpLy1Vhx8uvZe7NZ",
  "9bnz4RShgq1hAnLnZbP8kbgBg1kEmcJBYQq3gQbmnSta",
  "5VY91ws6B2hMmBFRsXkoAAdsPHBJwRfBht4DXox3xkwn",
  "2nyhqdwKcJZR2vcqCyrYsaPVdAnFoJjiksCXJ7hfEYgD",
  "2q5pghRs6arqVjRvT5gfgWfWcHWmw1ZuCzphgd5KfWGJ",
  "wyvPkWjVZz1M8fHQnMMCDTQDbkManefNNhweYk5WkcF",
  "3KCKozbAaF75qEU33jtzozcJ29yJuaLJTy2jFdzUY8bT",
  "4vieeGHPYPG2MmyPRcYjdiDmmhN3ww7hsFNap8pVN3Ey",
  "4TQLFNWK8AovT1gFvda5jfw2oJeRMKEmw7aH6MGBJ3or",
  "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
  "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
  "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
  "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
  "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
  "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
  "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
  "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
  "node1PqAa3BWWzUnTHVbw8NJHC874zn9ngAkXjgWEej",
  "node1UzzTxAAeBTpfZkQPJXBAqixsbdth11ba1NXLBG",
  "node1Qm1bV4fwYnCurP8otJ9s5yrkPq7SPZ5uhj3Tsv",
  "node1PUber6SFmSQgvf2ECmXsHP5o3boRSGhvJyPMX1",
  "node1AyMbeqiVN6eoQzEAwCA6Pk826hrdqdAHR7cdJ3",
  "node1YtWCoTwwVYTFLfS19zquRQzYX332hs1HEuRBjC",
  "TEMPaMeCRFAS9EKF53Jd6KpHxgL47uWLcpFArU1Fanq",
  "noz3jAjPiHuBPqiSPkkugaJDkJscPuRhYnSpbi8UvC4",
  "noz3str9KXfpKknefHji8L1mPgimezaiUyCHYMDv1GE",
  "noz6uoYCDijhu1V7cutCpwxNiSovEwLdRHPwmgCGDNo",
  "noz9EPNcT7WH6Sou3sr3GGjHQYVkN3DNirpbvDkv9YJ",
  "nozc5yT15LazbLTFVZzoNZCwjh3yUtW86LoUyqsBu4L",
  "nozFrhfnNGoyqwVuwPAW4aaGqempx4PU6g6D9CJMv7Z",
  "nozievPk7HyK1Rqy1MPJwVQ7qQg2QoJGyP71oeDwbsu",
  "noznbgwYnBLDHu8wcQVCEw6kDrXkPdKkydGJGNXGvL7",
  "nozNVWs5N8mgzuD3qigrCG2UoKxZttxzZ85pvAQVrbP",
  "nozpEGbwx4BcGp6pvEdAh1JoC2CQGZdU6HbNP1v2p6P",
  "nozrhjhkCr3zXT3BiT4WCodYCUFeQvcdUkM7MqhKqge",
  "nozrwQtWhEdrA6W8dkbt9gnUaMs52PdAv5byipnadq3",
  "nozUacTVWub3cL4mJmGCYjKZTnE9RbdY5AP46iQgbPJ",
  "nozWCyTPppJjRuw2fpzDhhWbW355fzosWSzrrMYB1Qk",
  "nozWNju6dY353eMkMqURqwQEoM3SFgEKC6psLCSfUne",
  "nozxNBgWohjR75vdspfxR5H9ceC7XXH99xpxhVGt3Bb",
  "soyas4s6L8KWZ8rsSk1mF3d1mQScoTGGAgjk98bF8nP",
  "soyascXFW5wEEYiwfEmHy2pNwomqzvggJosGVD6TJdY",
  "soyasDBdKjADwPz3xk82U3TNPRDKEWJj7wWLajNHZ1L",
  "soyasE2abjBAynmHbGWgEwk4ctBy7JMTUCNrMbjcnyH",
  "ste11JV3MLMM7x7EJUM2sXcJC1H7F4jBLnP9a9PG8PH",
  "ste11MWPjXCRfQryCshzi86SGhuXjF4Lv6xMXD2AoSt",
  "ste11p5x8tJ53H1NbNQsRBg1YNRd4GcVpxtDw8PBpmb",
  "ste11p7e2KLYou5bwtt35H7BM6uMdo4pvioGjJXKFcN",
  "ste11TMV68LMi1BguM4RQujtbNCZvf1sjsASpqgAvSX",
  "Eb2KpSC8uMt9GmzyAEm5Eb1AAAgTjRaXWFjKyFXHZxF3",
  "FCjUJZ1qozm1e8romw216qyfQMaaWKxWsuySnumVCCNe",
  "ENxTEjSQ1YabmUpXAdCgevnHQ9MHdLv8tzFiuiYJqa13",
  "6rYLG55Q9RpsPGvqdPNJs4z5WTxJVatMB8zV3WJhs5EK",
  "Cix2bHfqPcKcM233mzxbLk14kSggUUiz2A87fJtGivXr",
]);

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
        throw new Error("Upstream request failed.");
      }
      if (body.error) {
        throw new Error("Upstream request failed.");
      }
      return body.result as T;
    } catch (error) {
      lastError = error;
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Upstream request failed.");
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
  return accountKeysFromTransaction(result)[0] ?? null;
}

function accountKeysFromTransaction(result: JsonObject) {
  const transaction = asObject(result.transaction);
  const message = transaction ? asObject(transaction.message) : null;
  const meta = asObject(result.meta);
  const accountKeys: string[] = [];

  if (!message) {
    return accountKeys;
  }

  for (const keyField of ["accountKeys", "staticAccountKeys"]) {
    const keys = asArray(message[keyField]);
    if (!keys) {
      continue;
    }

    keys.forEach((entry) => {
      const key = extractAccountKey(entry);
      if (key) {
        accountKeys.push(key);
      }
    });
  }

  const loadedAddresses = meta ? asObject(meta.loadedAddresses) : null;
  if (!loadedAddresses) {
    return accountKeys;
  }

  for (const keyField of ["writable", "readonly"]) {
    const keys = asArray(loadedAddresses[keyField]);
    if (!keys) {
      continue;
    }

    keys.forEach((entry) => {
      const key = asString(entry);
      if (key) {
        accountKeys.push(key);
      }
    });
  }

  return accountKeys;
}

function decodeBase58(value: string) {
  if (!value) {
    return new Uint8Array();
  }

  const bytes = [0];

  for (const char of value) {
    const mapped = BASE58_CHAR_TO_VALUE[char];
    if (mapped === undefined) {
      return new Uint8Array();
    }

    let carry = mapped;
    for (let index = 0; index < bytes.length; index += 1) {
      const current = bytes[index] * 58 + carry;
      bytes[index] = current & 0xff;
      carry = current >> 8;
    }

    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  for (let index = 0; index < value.length && value[index] === "1"; index += 1) {
    bytes.push(0);
  }

  return Uint8Array.from(bytes.reverse());
}

function decodeInstructionData(dataField: JsonValue | undefined) {
  if (typeof dataField === "string") {
    return decodeBase58(dataField);
  }

  return new Uint8Array();
}

function readLittleEndianNumber(bytes: Uint8Array, offset: number, width: number) {
  let value = 0;

  for (let index = 0; index < width; index += 1) {
    value += (bytes[offset + index] ?? 0) * 2 ** (8 * index);
  }

  return value;
}

function extractLanderTipLamports(result: JsonObject, walletCandidates: Set<string>) {
  if (walletCandidates.size === 0) {
    return 0;
  }

  const transaction = asObject(result.transaction);
  const message = transaction ? asObject(transaction.message) : null;
  if (!message) {
    return 0;
  }

  const accountKeys = accountKeysFromTransaction(result);
  const instructions = asArray(message.instructions);
  if (!instructions) {
    return 0;
  }

  let totalTipLamports = 0;

  instructions.forEach((instructionEntry) => {
    const instruction = asObject(instructionEntry);
    if (!instruction) {
      return;
    }

    const programIdIndex = asNumber(instruction.programIdIndex);
    if (programIdIndex === null || accountKeys[programIdIndex] !== SYSTEM_PROGRAM_ID) {
      return;
    }

    const accounts = asArray(instruction.accounts);
    if (!accounts || accounts.length < 2) {
      return;
    }

    const fromIndex = asNumber(accounts[0]);
    const toIndex = asNumber(accounts[1]);
    if (fromIndex === null || toIndex === null) {
      return;
    }

    const fromKey = accountKeys[fromIndex];
    const toKey = accountKeys[toIndex];
    if (!fromKey || !toKey || !walletCandidates.has(fromKey) || !LANDER_TIP_ACCOUNTS.has(toKey)) {
      return;
    }

    const data = decodeInstructionData(instruction.data);
    if (data.length < 12) {
      return;
    }

    const instructionType = readLittleEndianNumber(data, 0, 4);
    if (instructionType !== 2) {
      return;
    }

    totalTipLamports += readLittleEndianNumber(data, 4, 8);
  });

  return totalTipLamports;
}

function extractTotalSolPaid(result: JsonObject, wallet: string | null) {
  const meta = asObject(result.meta);
  const txFeeLamports = meta ? asNumber(meta.fee) ?? 0 : 0;
  const feePayer = accountKeysFromTransaction(result)[0] ?? null;
  const walletCandidates = new Set<string>(
    [wallet, feePayer].filter((value): value is string => typeof value === "string" && value.length > 0),
  );
  const tipLamports = extractLanderTipLamports(result, walletCandidates);

  return (txFeeLamports + tipLamports) / LAMPORTS_PER_SOL;
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
    totalSolPaid: extractTotalSolPaid(result, extractWalletFromTransaction(result)),
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
      totalSolPaid: bot.totalSolPaid,
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
      } catch {
        txErrors[signature] = "Unable to fetch transaction metadata.";
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
      } catch {
        blockErrors[String(slot)] = "Unable to fetch block index data.";
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
    slotMs,
    trigger: txRecords[triggerSignature],
    rankedBots,
    skippedBotErrors,
    blockErrors,
    missingIdxBySlot,
  };
}
