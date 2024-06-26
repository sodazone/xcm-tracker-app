import { XcmJourneyWaypoint } from "../../lib/journey";
import {
  IconChainFail,
  IconChainSkipped,
  IconChainSuccess,
  IconChainTimeout,
  IconChainWait,
  getIconChain,
} from "./ChainIcon";

export function IconPulse() {
  return (
    <span className="inline-block animate-pulse w-2 h-3 bg-yellow-400"></span>
  );
}

export function IconWait() {
  return (
    <div className="flex items-center h-8">
      <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full bg-transparent">
        <span className="inline-block animate-pulse w-3 h-3 bg-yellow-600 rounded-full"></span>
      </div>
    </div>
  );
}

export function IconSuccess() {
  return (
    <div className="flex items-center h-8">
      <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full bg-transparent ring-2 ring-green-600">
        <svg
          className="w-2.5 h-2.5 text-green-300"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 16 12"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M1 5.917 5.724 10.5 15 1.5"
          />
        </svg>
      </div>
    </div>
  );
}

export function IconFail() {
  return (
    <div className="flex items-center h-8">
      <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full bg-transparent ring-2 ring-red-500">
        <svg
          className="h-4 w-4 fill-current text-red-500"
          role="status"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
        </svg>
      </div>
    </div>
  );
}

export function IconSkipped() {
  return (
    <div className="flex items-center h-8">
      <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full bg-transparent ring-2 ring-gray-400">
        <svg
          className="h-4 w-4 fill-current text-gray-400"
          role="status"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
        >
          <path d="M2 8a1 1 0 011-1h10a1 1 0 110 2H3a1 1 0 01-1-1z" />
        </svg>
      </div>
    </div>
  );
}

export function IconTimeout() {
  return (
    <div className="flex items-center h-8">
      <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full bg-transparent ring-2 ring-yellow-600">
        <svg
          className="h-4 w-4 fill-current text-yellow-600"
          role="status"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            stroke="currentColor"
            fill-opacity="0"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 19H12.01M8.21704 7.69689C8.75753 6.12753 10.2471 5 12 5C14.2091 5 16 6.79086 16 9C16 10.6565 14.9931 12.0778 13.558 12.6852C12.8172 12.9988 12.4468 13.1556 12.3172 13.2767C12.1629 13.4209 12.1336 13.4651 12.061 13.6634C12 13.8299 12 14.0866 12 14.6L12 16"
          />
        </svg>
      </div>
    </div>
  );
}

export function getIconForOutcome(
  { chainId, outcome, skipped, timeout }: XcmJourneyWaypoint,
  withChain = true,
) {
  if (outcome === undefined) {
    if (timeout) {
      return withChain ? IconChainTimeout(chainId) : IconTimeout();
    }
    return withChain ? IconChainWait(chainId) : IconWait();
  } else if (outcome === "Success") {
    return withChain ? IconChainSuccess(chainId) : IconSuccess();
  } else {
    if (skipped) {
      return withChain ? IconChainSkipped(chainId) : IconSkipped();
    }
    return withChain ? IconChainFail(chainId) : IconFail();
  }
}

// XXX just a quick hack
export function getIconForOutcomeFromConsensus(j: XcmJourneyWaypoint) {
  const { chainId } = j;
  const relay = chainId.substring(0, chainId.lastIndexOf(":") + 1) + "0";
  if (chainId === relay) {
    return getIconForOutcome(j);
  }

  return (
    <span className="flex relative">
      {getIconForOutcome(j)}
      <span className="flex absolute -ml-2 -mt-2">
        {getIconChain(relay, "xs")}
      </span>
    </span>
  );
}
