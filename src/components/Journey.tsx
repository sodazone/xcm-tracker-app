import { Transition } from "@headlessui/react";
import {
  ArrowLongDownIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import { useFormattedAssets } from "../hooks/assets";
import { XcmJourney } from "../lib/journey";
import { HumanizedXcm, humanize } from "../lib/kb";
import { formatDateTime } from "../lib/utils";
import { AddressWithLink } from "./AddressWithLink";
import { Balance } from "./Balances";
import { CodeBlock } from "./CodeBlock";
import { Leg } from "./Leg";
import { getIconForOutcomeFromConsensus } from "./icons/OutcomeIcon";
import { getXcmTypeBadge } from "./icons/XcmTypeBadge";
import { IconPin, IconUnpin } from "./icons/common";

type Props = {
  journey: XcmJourney;
  pinned: boolean;
  onPinClick: () => void;
};

export function Journey({ journey, pinned, onPinClick }: Props) {
  const [expanded, setExpanded] = useState<boolean>();
  const [legsExpanded, setLegsExpanded] = useState<boolean>(false);
  const [shown, setShown] = useState<boolean>(true);
  const [humanized, setHumanized] = useState<HumanizedXcm>();
  const chainId = journey.destination.chainId;

  // TODO: refactor to use new XCM Humanizer agent
  const formattedAssets = useFormattedAssets(chainId, humanized);

  // biome-ignore lint/correctness/useExhaustiveDependencies: will be refactored
  useEffect(() => {
    setHumanized(humanize(journey));
  }, [journey.id]);

  if (!humanized) {
    return null;
  }

  return (
    <div className="overflow-hidden">
      <Transition
        appear={true}
        show={shown}
        unmount={false}
        enter="transition-all transform delay-100 duration-300"
        enterFrom="opacity-0 scale-95 max-h-0"
        enterTo="opacity-100 scale-100 max-h-99"
        leave="transition-all transform delay-100 duration-300"
        leaveFrom="opacity-100 scale-100 max-h-96"
        leaveTo="opacity-0 scale-95 max-h-0"
        afterLeave={() => {
          onPinClick();
        }}
      >
        <div className="flex flex-col w-full border-b border-gray-900">
          <div className="w-full flex justify-between p-4 bg-gray-900 bg-opacity-80 flex-row items-center md:p-4">
            <button
              className="hidden h-4 w-4 text-gray-300 mr-3 md:inline-block"
              onClick={() => {
                setShown(false);
              }}
            >
              {pinned ? <IconUnpin /> : <IconPin />}
            </button>
            <div className="w-full text-gray-400 justify-between items-center hidden md:inline-flex md:space-x-4">
              <div className="flex items-center space-x-4">
                {getXcmTypeBadge(humanized.type)}
                {formattedAssets.length > 0 && (
                  <div className="flex flex-wrap space-x-4">
                    {formattedAssets.map((a, i) => (
                      <Balance
                        key={a.symbol === "UNITS" ? `UNITS-${i}` : a.symbol}
                        amount={a.amount}
                        decimals={a.decimals}
                        symbol={a.symbol}
                      />
                    ))}
                  </div>
                )}
                <div className="flex space-x-2 items-center">
                  <span className="text-sm">from</span>
                  <AddressWithLink
                    address={humanized.from}
                    chainId={journey.origin.chainId}
                  />
                  <span className="text-sm">to</span>
                  <AddressWithLink
                    address={humanized.to}
                    chainId={journey.destination.chainId}
                  />
                </div>
                <div className="flex items-center space-x-4 p-1 md:p-0 md:items-center">
                  {getIconForOutcomeFromConsensus(journey.origin)}
                  <ArrowRightIcon className="size-4" />
                  {getIconForOutcomeFromConsensus(journey.destination)}
                </div>
              </div>
              <div className="flex flex-shrink items-center space-x-2">
                <span className="mr-3 text-sm">
                  {" "}
                  {formatDateTime(journey.created)}{" "}
                </span>
                <button
                  className="text-gray-300 hover:text-gray-500 focus:outline-none"
                  onClick={() => setExpanded((prev) => !prev)}
                >
                  {expanded ? (
                    <ChevronDownIcon className="size-5" />
                  ) : (
                    <ChevronRightIcon className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col text-gray-400 md:hidden">
              <div className="w-fit">{getXcmTypeBadge(humanized.type)}</div>
              {formattedAssets.length > 0 && (
                <div className="mt-4">
                  {formattedAssets.map((a, i) => (
                    <Balance
                      key={a.symbol === "TOKEN" ? `TOKEN-${i}` : a.symbol}
                      amount={a.amount}
                      decimals={a.decimals}
                      symbol={a.symbol}
                    />
                  ))}
                </div>
              )}
              <div className="flex flex-col space-y-4 mt-6 mb-4">
                <div className="flex space-x-4 ml-2 items-center">
                  {getIconForOutcomeFromConsensus(journey.origin)}
                  <AddressWithLink
                    address={humanized.from}
                    chainId={journey.origin.chainId}
                  />
                </div>
                <ArrowLongDownIcon className="size-4 ml-10" />
                <div className="flex space-x-4 ml-2 items-center">
                  {getIconForOutcomeFromConsensus(journey.destination)}
                  <AddressWithLink
                    address={humanized.to}
                    chainId={journey.destination.chainId}
                  />
                </div>
              </div>
              <span className="mr-3 text-sm">
                at {formatDateTime(journey.created, true)}{" "}
              </span>
            </div>

            <button
              className="h-4 w-4 text-gray-300 self-start md:hidden"
              onClick={() => {
                setShown(false);
              }}
            >
              {pinned ? <IconUnpin /> : <IconPin />}
            </button>
          </div>

          <button
            className="flex w-full text-sm bg-gray-900 bg-opacity-80 border-t border-gray-900 text-gray-400 p-4 justify-between focus:outline-none md:hidden"
            onClick={() => setExpanded((prev) => !prev)}
          >
            <span className="flex space-x-2 items-center">
              <CodeBracketIcon className="size-4" />
              <span>Instructions</span>
            </span>
            {expanded ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )}
          </button>
          {expanded && (
            <div className="xcm-details flex flex-col">
              {journey.forwardId && (
                <>
                  <div className="heading">XCM Forward ID</div>
                  <span className="panel">{journey.forwardId}</span>
                </>
              )}
              {journey.topicId && (
                <>
                  <div className="heading">XCM Topic ID</div>
                  <span className="panel">{journey.topicId}</span>
                </>
              )}

              <div className="heading">XCM Origin Message Hash</div>
              <div className="panel">{journey.origin.messageHash}</div>
              <div className="heading">XCM Instructions</div>
              <div className="panel overflow-auto max-h-64">
                <CodeBlock
                  code={JSON.stringify(journey.instructions, null, 2)}
                />
              </div>
            </div>
          )}
          <button
            className={`flex w-full text-sm bg-gray-900 bg-opacity-80 border-t border-gray-900 text-gray-400 p-4 justify-between focus:outline-none md:hidden`}
            onClick={() => setLegsExpanded((prev) => !prev)}
          >
            <span className="flex space-x-2 items-center">
              <MapPinIcon className="size-4" />
              <span>Journey</span>
            </span>
            {legsExpanded ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )}
          </button>
          {journey.legs.map((l) => (
            <Leg
              key={`${journey.id}-leg-${l.index}`}
              leg={l}
              expanded={legsExpanded}
            />
          ))}
        </div>
      </Transition>
    </div>
  );
}
