"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertCircle, Clock3, LogOut, Search, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CompareResult } from "@/lib/types";
import { shortSignature } from "@/lib/utils";

type FormState = {
  trigger: string;
  bots: string;
  slotMs: string;
};

export function RankerClient() {
  const [form, setForm] = useState<FormState>({
    trigger: "",
    bots: "",
    slotMs: "400",
  });
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  // Build trigger: 2025-03-17-v2

  const botCount = useMemo(
    () => form.bots.split(/\r?\n/).map((value) => value.trim()).filter(Boolean).length,
    [form.bots],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trigger: form.trigger,
          bots: form.bots.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
          slotMs: Number(form.slotMs),
        }),
      });

      const body = (await response.json()) as CompareResult | { error: string };
      if (!response.ok) {
        if (response.status === 401) {
          window.location.reload();
          return;
        }
        throw new Error("error" in body ? body.error : "Request failed");
      }

      setResult(body as CompareResult);
    } catch (submitError) {
      setResult(null);
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function onLogout() {
    setSigningOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      window.location.reload();
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <section className="flex flex-col gap-4 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-600 via-blue-600 to-slate-900 px-6 py-8 text-white shadow-soft md:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-blue-50">
            IDX Slot Bot Checker
          </div>
          <Button
            type="button"
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/20"
            onClick={onLogout}
            disabled={signingOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {signingOut ? "Signing out..." : "Sign out"}
          </Button>
        </div>
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Check trigger tx vs bot txs in the browser.</h1>
          <p className="text-sm text-blue-50/90 md:text-base">
            Paste a trigger transaction and any number of bot transactions. All RPC access stays server-side while the
            app compares slot, intra-slot index, same-slot ordering, and estimated delay.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Compare transactions</CardTitle>
            <CardDescription>Accepts raw signatures or Solscan transaction links.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_180px_auto] xl:items-end" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger transaction</Label>
                <Input
                  id="trigger"
                  value={form.trigger}
                  onChange={(event) => setForm((current) => ({ ...current, trigger: event.target.value }))}
                  placeholder="Raw signature or Solscan tx URL"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bots">Bot transactions</Label>
                  <span className="text-xs text-slate-500">{botCount} entered</span>
                </div>
                <Textarea
                  id="bots"
                  value={form.bots}
                  onChange={(event) => setForm((current) => ({ ...current, bots: event.target.value }))}
                  placeholder={"One per line\nhttps://solscan.io/tx/...\nhttps://solscan.io/tx/..."}
                  className="min-h-[132px] xl:min-h-[112px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slot-ms">Slot ms assumption</Label>
                <Input
                  id="slot-ms"
                  inputMode="decimal"
                  value={form.slotMs}
                  onChange={(event) => setForm((current) => ({ ...current, slotMs: event.target.value }))}
                  placeholder="400"
                />
              </div>

              <Button className="w-full xl:mb-0.5 xl:w-auto xl:px-8" type="submit" disabled={loading}>
                {loading ? "Checking..." : "Run comparison"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard icon={Search} label="Trigger input" value="Hash or Solscan URL" />
          <InfoCard icon={Wallet} label="Wallet column" value="First 5 chars emphasized" />
          <InfoCard icon={Clock3} label="Delay estimate" value="Slot + idx based" />
        </div>

        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-3 p-5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </CardContent>
          </Card>
        ) : null}

        {result ? <ResultsSection result={result} /> : <EmptyState />}
      </section>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Search;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-sm font-medium text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Search className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-950">No results yet</h3>
          <p className="max-w-md text-sm text-slate-600">
            Submit a trigger transaction and bot transactions to see ranked slot proximity and intra-slot ordering.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultsSection({ result }: { result: CompareResult }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="RPC mode" value="Server-only" />
        <StatCard label="Bot txs ranked" value={String(result.rankedBots.length)} />
        <StatCard label="Slot ms" value={result.slotMs.toFixed(1)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparison table</CardTitle>
          <CardDescription>Ranked by closeness to the trigger using slot delta and intra-slot position.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden px-2 pb-3 pt-0 sm:px-3">
          <table className="w-full table-fixed border-separate border-spacing-0 text-left text-xs leading-5 sm:text-[13px]">
            <colgroup>
              <col className="w-[7%]" />
              <col className="w-[22%]" />
              <col className="w-[22%]" />
              <col className="w-[13%]" />
              <col className="w-[7%]" />
              <col className="w-[8%]" />
              <col className="w-[6%]" />
              <col className="w-[10%]" />
              <col className="w-[5%]" />
            </colgroup>
            <thead>
              <tr>
                {[
                  "Rank",
                  "Wallet",
                  "Sig",
                  "Slot",
                  "Idx",
                  "IdxΔ",
                  "SlotΔ",
                  "Paid SOL",
                  "EstMs",
                ].map((header) => (
                  <th key={header} className="border-b border-slate-200 px-2 py-2 font-medium text-slate-600 whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <ResultRow
                row={{
                  rank: 0,
                  name: "trigger",
                  signature: result.trigger.signature,
                  wallet: result.trigger.wallet,
                  slot: result.trigger.slot,
                  idx: result.trigger.idx,
                  idxDelta: 0,
                  slotDelta: 0,
                  sameSlotIdxDelta: 0,
                  totalSolPaid: result.trigger.totalSolPaid,
                  estDelayMs: 0,
                }}
                trigger
              />
              {result.rankedBots.map((row) => (
                <ResultRow key={row.signature} row={row} />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultRow({
  row,
  trigger = false,
}: {
  row: {
    rank: number;
    name: string;
    signature: string;
    wallet: string | null;
    slot: number;
    idx: number | null;
    idxDelta: number | null;
    slotDelta: number;
    sameSlotIdxDelta: number | null;
    totalSolPaid: number;
    estDelayMs: number;
  };
  trigger?: boolean;
}) {
  return (
    <tr className={trigger ? "bg-blue-50/60" : "hover:bg-slate-50"}>
      <td className="border-b border-slate-100 px-2 py-2 font-medium text-slate-900 whitespace-nowrap">{trigger ? "TRG" : row.rank}</td>
      <td className="border-b border-slate-100 px-2 py-2 font-mono text-[11px] text-slate-700 whitespace-nowrap" title={row.wallet ?? undefined}>
        <WalletPreview wallet={row.wallet} />
      </td>
      <td className="border-b border-slate-100 px-2 py-2 font-mono text-[11px] text-slate-700 whitespace-nowrap" title={row.signature}>
        {shortSignature(row.signature, 9, 7)}
      </td>
      <td className="border-b border-slate-100 px-2 py-2 font-mono text-slate-700 whitespace-nowrap">{row.slot}</td>
      <td className="border-b border-slate-100 px-2 py-2 font-mono text-slate-700 whitespace-nowrap">{row.idx ?? "-"}</td>
      <td className="border-b border-slate-100 px-2 py-2 font-mono text-slate-700 whitespace-nowrap">{row.idxDelta === null ? "-" : row.idxDelta >= 0 ? `+${row.idxDelta}` : row.idxDelta}</td>
      <td className="border-b border-slate-100 px-2 py-2 font-mono text-slate-700 whitespace-nowrap">{row.slotDelta >= 0 ? `+${row.slotDelta}` : row.slotDelta}</td>
      <td className="border-b border-slate-100 px-2 py-2 font-mono text-slate-700 whitespace-nowrap">{row.totalSolPaid.toFixed(6)}</td>
      <td className="border-b border-slate-100 px-2 py-2 font-mono text-slate-700 whitespace-nowrap">{row.estDelayMs >= 0 ? `+${row.estDelayMs.toFixed(1)}` : row.estDelayMs.toFixed(1)}</td>
    </tr>
  );
}

function WalletPreview({ wallet }: { wallet: string | null }) {
  if (!wallet) {
    return <span>-</span>;
  }

  const prefix = wallet.slice(0, 5);
  const remainder = wallet.length > 12 ? `${wallet.slice(5, 8)}...${wallet.slice(-4)}` : wallet.slice(5);

  return (
    <>
      <span className="font-bold text-slate-900">{prefix}</span>
      <span>{remainder}</span>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="break-all text-sm font-medium text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}

