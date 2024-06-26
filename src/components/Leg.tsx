import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { chains } from "../chains";
import { TypedXcmJourneyWaypoint, XcmJourneyLeg } from "../lib/journey";
import {
  getIconForOutcome,
  getIconForOutcomeFromConsensus,
} from "./icons/OutcomeIcon";

function renderBlockInfo({
  chainId,
  event,
  extrinsicId,
  blockNumber,
}: TypedXcmJourneyWaypoint) {
  const subscan = chains[chainId]?.subscanLink;
  if (event && Object.keys(event).length > 0) {
    const xtId = extrinsicId ?? `${blockNumber}-0`;
    const link = subscan
      ? `${subscan}/extrinsic/${xtId}?event=${event.eventId}`
      : undefined;
    return (
      <a
        target="_blank"
        href={link}
        className={`${link ? "hover:underline" : ""} flex space-x-1 text-sm items-center text-gray-300`}
      >
        <span>{event.eventId}</span>
        <ArrowTopRightOnSquareIcon className="size-4" />
      </a>
    );
  }

  if (blockNumber) {
    const link = subscan ? `${subscan}/block/${blockNumber}` : undefined;
    return (
      <a
        target="_blank"
        href={link}
        className={`${link ? "hover:underline" : ""} flex space-x-1 text-sm items-center text-gray-300`}
      >
        <span>{blockNumber}</span>
        <ArrowTopRightOnSquareIcon className="size-4" />
      </a>
    );
  }

  return "";
}

export function Leg({
  leg,
  expanded,
}: { leg: XcmJourneyLeg; expanded: boolean }) {
  const label =
    leg.type === "bridge"
      ? "from " +
        leg.stops.map((s) => s.chainId.split(":")[2].toUpperCase()).join(" to ")
      : "on " + leg.stops[0].chainId.split(":")[2].toUpperCase();
  return (
    <div className="flex flex-col">
      <div
        className={`${expanded ? "inline-block" : "hidden"} md:inline-block`}
      >
        <div className="flex mx-auto py-2 px-4 bg-gray-900 border-t border-gray-800 bg-opacity-70 text-gray-400 text-sm">
          {label}
        </div>
        <div className="flex flex-col bg-gray-900 bg-opacity-50">
          {(leg.stops as TypedXcmJourneyWaypoint[]).map((stop, i) => (
            <div
              key={"leg-" + leg.index + "-" + i}
              className="flex w-full border-t border-gray-800 border-opacity-70 items-center justify-between px-6 py-4"
            >
              <div className="flex items-center justify-center space-x-4">
                {getIconForOutcomeFromConsensus(stop)}
                {renderBlockInfo(stop)}
                <span className="hidden ml-auto text-gray-400 text-xs font-mono capitalize md:block">
                  {stop.event && Object.keys(stop.event).length > 0
                    ? `${stop.event.section} ${stop.event.method}`
                    : ""}
                </span>
              </div>
              <div className="flex justify-end items-center space-x-4">
                {stop.assetsTrapped !== undefined && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-red-500 text-gray-900">
                    trapped
                  </span>
                )}
                {getIconForOutcome(stop, false)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
