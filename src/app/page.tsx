import { RankerClient } from "@/components/ranker-client";

const DEFAULT_RPC_URL = process.env.NEXT_PUBLIC_DEFAULT_RPC_URL || "";

export default function HomePage() {
  return <RankerClient defaultRpcUrl={DEFAULT_RPC_URL} />;
}
