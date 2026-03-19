export type TxRecord = {
  signature: string;
  wallet: string | null;
  slot: number;
  blockTime: number | null;
  idx: number | null;
  slotTxCount: number | null;
  totalSolPaid: number;
};

export type RankedRow = {
  rank: number;
  name: string;
  signature: string;
  wallet: string | null;
  slot: number;
  idx: number | null;
  slotTxCount: number | null;
  slotDelta: number;
  idxDelta: number | null;
  sameSlotIdxDelta: number | null;
  estDelayMs: number;
  absEstDelayMs: number;
  totalSolPaid: number;
};

export type CompareResult = {
  slotMs: number;
  trigger: TxRecord;
  rankedBots: RankedRow[];
  skippedBotErrors: Record<string, string>;
  blockErrors: Record<string, string>;
  missingIdxBySlot: Record<string, string[]>;
};

export type CompareRequestPayload = {
  trigger: string;
  bots: string[];
  slotMs?: number;
};
