import { useEffect, useState } from "react";

import { Map as IMap } from "immutable";

import { xcm } from "@sodazone/ocelloids-client";

import { useOcelloidsContext } from "../context/OcelloidsContext";
import { XcmJourney, mergeJourney, toJourneyId } from "../lib/journey";

import { FixedSizedCache } from "../lib/cache";
import { Journey } from "./Journey";
import { IconPulse } from "./icons/OutcomeIcon";

export function SubscriptionStreams() {
  const { client, getSelectedSubscriptions } = useOcelloidsContext();
  const [connections, setConnections] = useState<WebSocket[]>([]);
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
      const subs = getSelectedSubscriptions();
      if (subs.length > 0 && connections.length === 0 && connecting === false) {
        console.log(
          "open ws",
          subs.map((s) => s.id),
        );
        setConnecting(true);

        const conn = [];

        for (const sub of subs) {
          conn.push(
            await client
              .agent<xcm.XcmInputs>("xcm")
              .subscribe<xcm.XcmMessagePayload>(sub.id, {
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
                      const journey = prev.journeys.get(id);
                      prev.journeys.set(id, mergeJourney(xcm, journey));
                      return {
                        pinned: prev.pinned,
                        journeys: prev.journeys,
                      };
                    }
                  });
                },
              }),
          );
        }

        setConnections(conn);
        setConnecting(false);
      }
    }

    connect();

    return () => {
      if (connections.length > 0) {
        console.log("close ws");

        for (const ws of connections) {
          ws.close(1000, "bye");
        }
        setConnections([]);
      }
      setState({
        journeys: new FixedSizedCache<XcmJourney>(),
        pinned: IMap<string, XcmJourney>(),
      });
    };
  }, [client, getSelectedSubscriptions, connections, connecting]);

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

  if (connections.length === 0) {
    return null;
  }

  if (state.journeys.length === 0 && state.pinned.count() === 0) {
    return (
      <div className="flex items-center space-x-2 p-4 bg-gray-900 bg-opacity-40 backdrop-blur">
        <span className="text-gray-200 uppercase">Waiting for events…</span>
        <IconPulse />
      </div>
    );
  }

  const pinnedEntries = [...state.pinned.entries()];
  const journeyEntries = state.journeys.entries();

  return (
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
  );
}
