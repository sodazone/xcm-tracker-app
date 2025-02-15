import { AnyJson, SignerData, xcm } from "@sodazone/ocelloids-client";

export type XcmJourneyOutcome = "Success" | "Fail" | "Skip";

export type XcmJourneyWaypoint = {
  chainId: string;
  messageHash?: string;
  blockNumber?: string | number;
  outcome?: XcmJourneyOutcome;
  error?: AnyJson;
  event?: AnyJson;
  blockPosition?: number;
  instructions?: AnyJson;
  assetsTrapped?: AnyJson;
  skipped?: boolean;
  timeout?: boolean;
};

export type TypedXcmJourneyWaypoint = {
  event?: {
    module: string;
    name: string;
    blockNumber: string;
    blockPosition: number;
    extrinsic?: {
      blockNumber: string;
      blockPosition: number;
    };
  };
} & Omit<XcmJourneyWaypoint, "event">;

export type XcmJourneyLeg = {
  stops: XcmJourneyWaypoint[];
  index: number;
  type: string;
};

export type XcmJourney = {
  id: string;
  sender?: SignerData;
  updated: number;
  created: number;
  instructions: unknown;
  origin: XcmJourneyWaypoint;
  destination: XcmJourneyWaypoint;
  legs: XcmJourneyLeg[];
  topicId?: string;
  forwardId?: string;
};

export type TypedXcmJourney = {
  origin: TypedXcmJourneyWaypoint;
  destination: TypedXcmJourneyWaypoint;
  stops: TypedXcmJourneyWaypoint[];
} & Omit<XcmJourney, "origin" | "destination" | "stops">;

export function toJourneyId({
  origin,
  messageId,
  forwardId,
  waypoint: { messageHash },
}: xcm.XcmMessagePayload) {
  if (forwardId !== undefined) {
    return forwardId;
  }
  return messageId === undefined
    ? `${origin.chainId}:${origin.blockNumber}|${messageHash}`
    : messageId;
}

function updateFailures(journey: XcmJourney): XcmJourney {
  const failureLegIndex = journey.legs.findIndex(
    (l) => l.stops.find((s) => s.outcome === "Fail") !== undefined,
  );
  if (failureLegIndex === -1) {
    return journey;
  }

  journey.destination.outcome = "Fail";

  if (failureLegIndex < journey.legs.length - 1) {
    journey.destination.skipped = true;
    journey.legs = journey.legs.map((l, i) => {
      if (i > failureLegIndex) {
        return {
          stops: l.stops.map((s) => ({
            ...s,
            outcome: "Fail",
            skipped: true,
          })),
          index: i,
          type: l.type,
        };
      } else if (i === failureLegIndex) {
        const stopIndex = l.stops.findIndex((s) => s.outcome === "Fail");
        l.stops = l.stops.map((s, i) =>
          i > stopIndex ? { ...s, outcome: "Fail", skipped: true } : s,
        );
        return l;
      } else {
        return l;
      }
    });
  }
  return journey;
}

function updateTimeout(journey: XcmJourney) {
  journey.destination.timeout = true;
  journey.legs = journey.legs.map((l) => {
    return {
      ...l,
      stops: l.stops.map((s) =>
        s.outcome === undefined
          ? {
              ...s,
              timeout: true,
            }
          : s,
      ),
    };
  });

  return journey;
}

export function toJourney(xcm: xcm.XcmMessagePayload): XcmJourney {
  const legs: XcmJourneyLeg[] = [];
  for (let index = 0; index < xcm.legs.length; index++) {
    const { from, to, relay, type } = xcm.legs[index];
    const leg: XcmJourneyLeg = {
      index,
      type,
      stops: [],
    };
    // the first stop of the first leg is always the origin
    if (index === 0) {
      leg.stops.push({ ...xcm.origin });
    } else {
      leg.stops.push({ chainId: from });
    }

    if (relay !== undefined) {
      leg.stops.push({ chainId: relay });
    }
    leg.stops.push({ chainId: to });

    if (xcm.waypoint.legIndex === index) {
      leg.stops = leg.stops.map((s) =>
        s.chainId === xcm.waypoint.chainId ? { ...xcm.waypoint } : s,
      );
    }
    legs.push(leg);
  }

  const now = Date.now();

  return updateFailures({
    id: toJourneyId(xcm),
    sender: xcm.sender,
    updated: now,
    created: now,
    instructions: xcm.waypoint.instructions,
    origin: {
      ...xcm.origin,
    },
    destination: {
      ...xcm.destination,
    },
    legs,
    topicId: xcm.messageId,
    forwardId: xcm.forwardId,
  });
}

export function mergeJourney(
  xcm: xcm.XcmMessagePayload,
  journey?: XcmJourney,
): XcmJourney {
  let j = journey;
  if (j === undefined) {
    j = toJourney(xcm);
  }

  if (xcm.type === "xcm.timeout") {
    return { ...updateTimeout(j) };
  }

  if (j.origin.chainId === xcm.waypoint.chainId) {
    j.origin = xcm.waypoint;
  }

  if (j.destination.chainId === xcm.waypoint.chainId) {
    if (xcm.waypoint.outcome) {
      j.destination = xcm.waypoint;
    }
  }

  j.updated = Date.now();

  const leg = j.legs[xcm.waypoint.legIndex];
  const stopIndex = leg.stops.findIndex(
    (s) => s.chainId === xcm.waypoint.chainId,
  );
  if (stopIndex === -1) {
    console.log("CANNOT FIND STOP!");
    return j;
  }
  const stop = leg.stops[stopIndex];
  if (stop.outcome || xcm.waypoint.outcome === undefined) {
    return j;
  }

  j.legs[xcm.waypoint.legIndex].stops[stopIndex] = {
    ...stop,
    ...xcm.waypoint,
  };

  return { ...updateFailures(j) };
}
