import {
  ArrowLongDownIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { XcmJourney } from "../lib/journey";
import { humanize } from "../lib/kb";
import { formatDateTime } from "../lib/utils";
import { CodeBlock } from "./CodeBlock";
import { Leg } from "./Leg";
import { getIconForOutcomeFromConsensus } from "./icons/OutcomeIcon";
import { getXcmTypeBadge } from "./icons/XcmTypeBadge";
import { IconPin, IconUnpin } from "./icons/common";
import { Transition } from "@headlessui/react";

type Props = {
  journey: XcmJourney;
  pinned: boolean;
  onPinClick: () => void;
};

export function Journey({ journey, pinned, onPinClick }: Props) {
  const [expanded, setExpanded] = useState<boolean>();
  const [legsExpanded, setLegsExpanded] = useState<boolean>(false);
  const [shown, setShown] = useState<boolean>(true)

  const { type, from, to } = humanize(journey);
  return (
    <Transition
      appear={true}
      show={shown}
      unmount={false}
      enter="transition ease-in delay-50 duration-200"
      enterFrom="opacity-50 -translate-y-8"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-out delay-50 duration-200"
      leaveFrom="opacity-100 md:translate-x-0"
      leaveTo="opacity-0 md:translate-x-8"
      afterLeave={() => {onPinClick()}}
    >
    <div className="flex flex-col w-full border-b border-gray-900">
      <div className="w-full flex justify-between p-4 bg-gray-900 bg-opacity-80 flex-row items-center md:p-4">
        <button
          className="hidden h-4 w-4 text-gray-300 mr-3 md:inline-block"
          onClick={() => {
            setShown(false)
          }}
        >
          {pinned ? <IconUnpin /> : <IconPin />}
        </button>
        <div className="w-full text-gray-400 justify-between items-center hidden md:inline-flex">
          <div className="flex items-center space-x-4">
            {getXcmTypeBadge(type)}
            <div className="flex space-x-2 items-center">
              <span className="text-sm">from</span>
              <span className="text-gray-300">{from}</span>
              <span className="text-sm">to</span>
              <span className="text-gray-300">{to}</span>
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
              onClick={() => setExpanded(!expanded)}
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
        <div className="w-fit">{getXcmTypeBadge(type)}</div>
          <div className="flex flex-col space-y-4 mt-6 mb-4">
            <div className="flex space-x-4 ml-2 items-center">
              {getIconForOutcomeFromConsensus(journey.origin)}
              <span className="text-gray-300">{from}</span>
            </div>
            <ArrowLongDownIcon className="size-4 ml-10" />
            <div className="flex space-x-4 ml-2 items-center">
              {getIconForOutcomeFromConsensus(journey.destination)}
              <span className="text-gray-300">{to}</span>
            </div>
          </div>
          <span className="mr-3 text-sm">
            at {formatDateTime(journey.created, true)}{" "}
          </span>
        </div>

        <button
          className="h-4 w-4 text-gray-300 self-start md:hidden"
          onClick={() => onPinClick()}
        >
          {pinned ? <IconUnpin /> : <IconPin />}
        </button>
      </div>
      
      <button
        className="flex w-full text-sm bg-gray-900 bg-opacity-80 border-t border-gray-900 text-gray-400 p-4 justify-between focus:outline-none md:hidden"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex space-x-2 items-center">
        <CodeBracketIcon className="size-4"/>
        <span>Instructions</span>
        </span>
        {expanded ? (
          <ChevronDownIcon className="size-4" />
        ) : (
          <ChevronRightIcon className="size-4" />
        )}
      </button>
      {expanded && (
        <div
          className="xcm-details flex flex-col"
          onClick={() => setExpanded(!expanded)}
        >
          {journey.forwardId && (
            <>
              <div className="heading">XCM Forward ID</div>
              <span className="panel">${journey.forwardId}</span>
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
          <div className="panel">
            <CodeBlock code={JSON.stringify(journey.instructions, null, 2)} />
          </div>
        </div>
      )}
      <button
        className={`flex w-full text-sm bg-gray-900 bg-opacity-80 border-t border-gray-900 text-gray-400 p-4 justify-between focus:outline-none md:hidden`}
        onClick={() => setLegsExpanded((prev) => !prev)}
      >
        <span className="flex space-x-2 items-center">
        <MapPinIcon className="size-4" />
        <span>
          Journey
        </span>
        </span>
        {legsExpanded ? (
          <ChevronDownIcon className="size-4" />
        ) : (
          <ChevronRightIcon className="size-4" />
        )}
      </button>
      {journey.legs.map((l) => (
        <Leg leg={l} expanded={legsExpanded} />
      ))}
      </div>
    </Transition>
  );
}
