import { fromBufferToBase58 } from "@polkadot-api/substrate-bindings";
import { fromHex } from "@polkadot-api/utils";
import { chains } from "../chains/index.js";

const dateTimeFormatLong = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const dateTimeFormatShort = new Intl.DateTimeFormat("en-US", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatUnits(value: bigint, decimals: number) {
  let display = value.toString();
  display = display.padStart(decimals, "0");

  let [integer, fraction] = [
    display.slice(0, display.length - decimals),
    display.slice(display.length - decimals),
  ];
  fraction = fraction.replace(/(0+)$/, "");
  return (integer || "0") + "." + (fraction || "0");
}

export function humanizeNumber(
  value: number,
  maximumFractionDigits = 4,
  siSeparator = " ",
  locale = "en-US",
): string {
  const absValue = Math.abs(value);

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
  if (absValue >= 1_000_000_000_000_000_000_000_000) {
    return (
      formatter.format(value / 1_000_000_000_000_000_000_000_000) +
      siSeparator +
      "Y"
    );
  } else if (absValue >= 1_000_000_000_000_000_000_000) {
    return (
      formatter.format(value / 1_000_000_000_000_000_000_000) +
      siSeparator +
      "Z"
    );
  } else if (absValue >= 1_000_000_000_000_000_000) {
    return (
      formatter.format(value / 1_000_000_000_000_000_000) + siSeparator + "E"
    );
  } else if (absValue >= 1_000_000_000_000_000) {
    return formatter.format(value / 1_000_000_000_000_000) + siSeparator + "P";
  } else if (absValue >= 1_000_000_000_000) {
    return formatter.format(value / 1_000_000_000_000) + siSeparator + "T";
  } else if (absValue >= 1_000_000_000) {
    return formatter.format(value / 1_000_000_000) + siSeparator + "B";
  } else if (absValue >= 1_000_000) {
    return formatter.format(value / 1_000_000) + siSeparator + "M";
  } else if (absValue >= 100_000) {
    return `${formatter.format(value / 1_000)}K` + siSeparator;
  } else if (absValue > 10_000) {
    return `${formatter.format(Math.round(absValue))}`;
  }

  return `${formatter.format(value)}`;
}

export function formatBalance(
  value: bigint,
  decimals: number,
  maximumFractionDigits?: number,
) {
  const units = formatUnits(value, decimals);
  const unitsNum = Number(units);

  if (unitsNum === 0) {
    return "0";
  } else if (Math.abs(unitsNum) < 0.000001) {
    return "<0.000001";
  } else if (Math.abs(unitsNum) < 0.001) {
    return humanizeNumber(unitsNum, 6);
  }

  return humanizeNumber(unitsNum, maximumFractionDigits);
}

export function trunc(str: string, len = 11, sep = "…") {
  if (str.length <= len) {
    return str;
  }
  const chars = len - sep.length;
  const frontChars = Math.ceil(chars / 2);
  const backChars = Math.floor(chars / 2);

  return (
    str.substring(0, frontChars) + sep + str.substring(str.length - backChars)
  );
}

export function chainName(id: string) {
  const chain = chains[id];
  if (chain !== undefined) {
    return chain.name;
  }
  return id;
}

export function toAddress(key: string, chainId: string) {
  const chain = chains[chainId];
  if (chain !== undefined) {
    return fromBufferToBase58(chain.ss58 ?? 42)(fromHex(key));
  }
  return key;
}

export function formatDateTime(timestamp: number, short: boolean = false) {
  if (short) {
    return dateTimeFormatShort.format(timestamp);
  }

  return dateTimeFormatLong.format(timestamp);
}

export function getStorageObject<T>(key: string): T | null {
  const val = localStorage.getItem(key);

  if (val === null) {
    return null;
  }

  return JSON.parse(val) as T;
}

export function setLocalStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function classNames(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
