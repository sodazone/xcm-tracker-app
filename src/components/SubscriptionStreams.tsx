import { useEffect, useState } from "react";

import { Map as IMap } from "immutable";

import { xcm as xcmTypes } from "@sodazone/ocelloids-client";

import { useOcelloidsContext } from "../context/OcelloidsContext";
import {
  XcmJourney,
  mergeJourney,
  toJourney,
  toJourneyId,
} from "../lib/journey";

import { FixedSizedCache } from "../lib/cache";
import { Journey } from "./Journey";
import { getIconChain } from "./icons/ChainIcon";
import { IconPulse } from "./icons/OutcomeIcon";

export function SubscriptionStreams() {
  const { client, subscription, networks } = useOcelloidsContext();
  const [connection, setConnection] = useState<WebSocket>();
  const [connecting, setConnecting] = useState<boolean>(false);
  const [state, setState] = useState<{
    journeys: FixedSizedCache<XcmJourney>;
    pinned: IMap<string, XcmJourney>;
  }>({
    journeys: new FixedSizedCache<XcmJourney>(),
    pinned: IMap<string, XcmJourney>(),
  });

  useEffect(() => {
    async function connect() {
      if (subscription && !connection && connecting === false) {
        console.log("open ws", subscription.id);
        setConnecting(true);

        const conn = await client
          .agent<xcmTypes.XcmInputs>("xcm")
          .subscribe<xcmTypes.XcmMessagePayload>(subscription.id, {
            onMessage: (msg) => {
              console.log("MSG", msg);

              const xcm = msg.payload;
              const id = toJourneyId(xcm);

              setState((prev) => {
                const pinnedJourney = prev.pinned.get(id);
                if (pinnedJourney !== undefined) {
                  const merged = mergeJourney(xcm, pinnedJourney);
                  return {
                    journeys: prev.journeys,
                    pinned: prev.pinned.set(id, merged),
                  };
                } else {
                  let journey;

                  // is the first message
                  if (prev.journeys.length === 0) {
                    journey = toJourney(xcm);
                    if (xcm.type === "xcm.received") {
                      journey.legs.forEach((leg) => {
                        leg.stops.forEach((stop) => {
                          if (stop.outcome === undefined) {
                            stop.skipped = true;
                            stop.outcome = "Skip";
                          }
                        });
                      });
                    }
                  } else {
                    const prevJourney = prev.journeys.get(id);
                    journey = mergeJourney(xcm, prevJourney);
                  }

                  prev.journeys.set(id, journey);
                  return {
                    pinned: prev.pinned,
                    journeys: prev.journeys,
                  };
                }
              });
            },
          });

        setConnection(conn);
        setConnecting(false);
      }
    }

    connect();

    return () => {
      if (connection) {
        console.log("close ws");
        connection.close(1000, "bye");
        setConnection(undefined);
      }
      setState({
        journeys: new FixedSizedCache<XcmJourney>(),
        pinned: IMap<string, XcmJourney>(),
      });
    };
  }, [client, subscription, connection, connecting]);

  function pinJourney(j: XcmJourney) {
    return () => {
      setState((prev) => {
        prev.journeys.delete(j.id);
        return {
          pinned: prev.pinned.set(j.id, j),
          journeys: prev.journeys,
        };
      });
    };
  }

  function unPinJourney(j: XcmJourney) {
    return () => {
      setState((prev) => {
        prev.journeys.set(j.id, j);
        return {
          pinned: prev.pinned.delete(j.id),
          journeys: prev.journeys,
        };
      });
    };
  }

  if (!connection || !subscription) {
    return null;
  }

  const header = (
    <div
      className={`isolate flex-col w-full text-sm text-gray-400 px-4 border-b border-gray-900 bg-gray-900 bg-opacity-90 md:divide-x md:divide-gray-900 md:flex-row md:space-x-3 md:flex`}
    >
      <div className="flex flex-col space-y-2 pb-2 pt-2 md:pt-0">
        <span className="uppercase font-semibold">Networks</span>
        <span className="flex -space-x-1">
          {networks.map((n) => getIconChain(n))}
        </span>
      </div>
    </div>
  );

  if (state.journeys.length === 0 && state.pinned.count() === 0) {
    return (
      <>
        {header}
        <div className="flex items-center space-x-2 p-4 bg-gray-900 bg-opacity-40 backdrop-blur">
          <span className="text-gray-200 uppercase">
            Waiting for cross-chain transactions…
          </span>
          <IconPulse />
        </div>
      </>
    );
  }

  const pinnedEntries = [...state.pinned.entries()];
  const journeyEntries = state.journeys.entries();

  return (
    <div>
      {header}

      <div className="flex flex-col backdrop-blur-xl">
        <div className="w-full">
          {pinnedEntries.map(([id, p]) => (
            <Journey
              key={id}
              journey={p}
              pinned={true}
              onPinClick={unPinJourney(p)}
            />
          ))}
        </div>
        <div className="w-full">
          {journeyEntries.map(([id, j]) => (
            <Journey
              key={id}
              journey={j}
              pinned={false}
              onPinClick={pinJourney(j)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
