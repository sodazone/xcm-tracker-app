import { formatBalance } from "../lib/utils";

export function FormatFigures({
  amount,
  symbol,
}: { amount: string; symbol?: string }) {
  const [num, si] = amount.split(" ");
  const [int, frac] = num.split(".");

  return (
    <span className="amt">
      <span>{int}</span>
      {frac && (
        <span>
          <span>.</span>
          <span className="text-white/40">{frac}</span>
        </span>
      )}
      {si && <span className="font-bold text-sm pl-0.5">{si}</span>}
      {symbol && <span className="pl-2">{symbol}</span>}
    </span>
  );
}

type Props = {
  amount: bigint;
  decimals?: number;
  symbol?: string;
};

export function Balance({ amount, decimals = 0, symbol = undefined }: Props) {
  return (
    <div className="font-mono text-wrap max-w-full">
      <FormatFigures amount={formatBalance(amount, decimals)} symbol={symbol} />
    </div>
  );
}
