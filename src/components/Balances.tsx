import { classNames, formatBalance } from "../lib/utils";

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
  className?: string;
};

export function Balance({
  amount,
  decimals = 0,
  symbol = undefined,
  className = "",
}: Props) {
  return (
    <div className={classNames("font-mono text-wrap max-w-full", className)}>
      <FormatFigures amount={formatBalance(amount, decimals)} symbol={symbol} />
    </div>
  );
}
