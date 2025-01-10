import { AnyJson } from "@sodazone/ocelloids-client";
import { XcmJourney } from "./journey.js";
import { toAddress } from "./utils.js";

export type XcmVersion = "v2" | "v3" | "v4";

export enum XcmJourneyType {
  Transfer = "transfer",
  Teleport = "teleport",
  Transact = "transact",
  QueryResponse = "queryResponse",
  Unknown = "??",
}

export type XcmAsset = {
  location: XcmV3MultiLocation;
  amount: string;
};

export type HumanizedXcm = {
  type: XcmJourneyType;
  to: string | null;
  from: string | null;
  assets: XcmAsset[];
  version?: XcmVersion;
};

type XcmV3MultiLocation = AnyJson;

type Concrete = {
  type: "Concrete";
  value: XcmV3MultiLocation;
};
type Abstract = {
  type: "Abstract";
  value: string;
};
export interface MultiAsset {
  id: Concrete | Abstract | XcmV3MultiLocation;
  fun: {
    type: string;
    value: string;
  };
}

type InitiateReserveWithdraw = {
  assets: MultiAsset[];
  reserve: AnyJson;
  xcm: XcmInstruction[];
};

type InitiateTeleport = {
  assets: MultiAsset[];
  dest: AnyJson;
  xcm: XcmInstruction[];
};

type DepositReserveAsset = InitiateTeleport;
type TransferReserveAsset = InitiateTeleport;

type ExportMessage = {
  xcm: XcmInstruction[];
};

type AccountId32 = {
  type: "AccountId32";
  value: {
    id: string;
  };
};

type AccountKey20 = {
  type: "AccountKey20";
  value: {
    key: string;
  };
};

type Parachain = {
  type: "Parachain";
  value: string;
};

type DepositAsset = {
  beneficiary: {
    interior: {
      type: string;
      value: AccountId32 | AccountKey20 | Parachain;
    };
  };
};

// type WithdrawAsset = MultiAsset[]
// type ReserveAssetDeposited = WithdrawAsset
// type ReceiveTeleportedAsset = WithdrawAsset

type XcmInstruction = {
  type: string;
  value: AnyJson;
};

type XcmVersionedInstructions = {
  type: string;
  value: XcmInstruction[];
};

function isConcrete(object: any): object is Concrete {
  return object.type !== undefined || object.type === "Concrete";
}

// WARN: this should be extracted to production rules kb
// eslint-disable-next-line complexity
export function humanize(journey: XcmJourney): HumanizedXcm {
  const { sender, origin, destination } = journey;
  const version = (origin.instructions as unknown as XcmVersionedInstructions)
    .type;
  const versioned = (origin.instructions as unknown as XcmVersionedInstructions)
    .value;
  const hopTransfer = versioned.find(
    (op) =>
      op.type === "InitiateReserveWithdraw" ||
      op.type === "InitiateTeleport" ||
      op.type === "DepositReserveAsset" ||
      op.type === "TransferReserveAsset",
  );
  const bridgeMessage = versioned.find((op) => op.type === "ExportMessage");

  let type = XcmJourneyType.Unknown;
  if (versioned.find((op) => op.type === "Transact")) {
    type = XcmJourneyType.Transact;
  } else if (versioned.find((op) => op.type === "QueryResponse")) {
    type = XcmJourneyType.QueryResponse;
  } else if (
    (versioned.find(
      (op) =>
        op.type === "WithdrawAsset" || op.type === "ReserveAssetDeposited",
    ) &&
      versioned.find((op) => op.type === "DepositAsset")) ||
    hopTransfer ||
    bridgeMessage
  ) {
    type = XcmJourneyType.Transfer;
  } else if (versioned.find((op) => op.type === "ReceiveTeleportedAsset")) {
    type = XcmJourneyType.Teleport;
  }

  // Extract beneficiary
  let deposit = versioned.find((op) => op.type === "DepositAsset");
  if (hopTransfer) {
    deposit = (
      hopTransfer.value as unknown as
        | InitiateTeleport
        | DepositReserveAsset
        | TransferReserveAsset
        | InitiateReserveWithdraw
    ).xcm.find((op) => op.type === "DepositAsset");
  }
  if (bridgeMessage) {
    deposit = (bridgeMessage.value as unknown as ExportMessage).xcm.find(
      (op) => op.type === "DepositAsset",
    );
  }

  let beneficiary = "unknown";

  if (deposit !== undefined) {
    const interiorValue = (deposit.value as unknown as DepositAsset).beneficiary
      .interior.value;

    let maybeMultiAddress = interiorValue;

    if (interiorValue && Array.isArray(interiorValue)) {
      maybeMultiAddress = interiorValue[0];
    }

    if (maybeMultiAddress.type === "AccountId32") {
      beneficiary = toAddress(maybeMultiAddress.value.id, destination.chainId);
    } else if (maybeMultiAddress.type === "AccountKey20") {
      beneficiary = maybeMultiAddress.value.key;
    } else if (maybeMultiAddress.type === "Parachain") {
      beneficiary = "ParaId " + maybeMultiAddress.value;
    }
  }

  // Extract assets
  const assets: XcmAsset[] = [];
  const _instruction = versioned.find(
    (op) =>
      (op.type === "ReserveAssetDeposited") !== undefined ||
      (op.type === "ReceiveTeleportedAsset") !== undefined ||
      (op.type === "WithdrawAsset") !== undefined,
  );
  if (
    _instruction !== undefined &&
    (type === XcmJourneyType.Transfer || type === XcmJourneyType.Teleport) &&
    !hopTransfer &&
    !bridgeMessage // hops and bridged assets need to be handled differently T.T
  ) {
    const multiAssets = _instruction.value as unknown as MultiAsset[];
    if (multiAssets !== undefined) {
      for (const multiAsset of multiAssets) {
        const { id, fun } = multiAsset;
        // non-fungible assets not supported
        if (fun.type !== "Fungible") {
          continue;
        }

        let multiLocation: XcmV3MultiLocation | undefined;
        if (isConcrete(id)) {
          multiLocation = id.value;
        } else {
          multiLocation = id;
        }

        // abstract asset ids not supported
        if (multiLocation !== undefined) {
          assets.push({
            location: multiLocation,
            amount: fun.value,
          });
        }
      }
    }
  }

  const signer = sender?.signer;
  const from = signer ? (signer.id as string) : null;
  const to = [XcmJourneyType.Teleport, XcmJourneyType.Transfer].includes(type)
    ? beneficiary
    : null;

  return {
    type,
    from,
    to,
    assets,
    version: version.toLowerCase() as XcmVersion,
  };
}
