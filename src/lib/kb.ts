import { AnyJson } from "@sodazone/ocelloids-client";
import { XcmJourney } from "./journey.js";
import { chainName, toAddress, trunc } from "./utils.js";

type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

type VersionedXcm =
  | { V2: XcmInstruction[] }
  | { V3: XcmInstruction[] }
  | { V4: XcmInstruction[] };

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
  to: string;
  from: string;
  assets: XcmAsset[];
  version?: XcmVersion;
};

interface AssetInstance {
  Index: number;
  Array4: string;
  Array8: string;
  Array16: string;
  Array32: string;
}

interface Fungibility {
  Fungible: string;
  NonFungible?: AssetInstance;
}

type XcmV3MultiLocation = AnyJson;

interface AssetId {
  Concrete: XcmV3MultiLocation;
  Abstract: string;
}

export interface MultiAsset {
  id: RequireOnlyOne<AssetId> | XcmV3MultiLocation;
  fun: RequireOnlyOne<Fungibility>;
}

interface XcmInstructionSchema {
  InitiateReserveWithdraw: {
    assets: MultiAsset[];
    reserve: AnyJson;
    xcm: XcmInstruction;
  };
  InitiateTeleport: {
    assets: MultiAsset[];
    dest: AnyJson;
    xcm: XcmInstruction;
  };
  DepositReserveAsset: {
    assets: MultiAsset[];
    dest: AnyJson;
    xcm: XcmInstruction;
  };
  TransferReserveAsset: {
    assets: MultiAsset[];
    dest: AnyJson;
    xcm: XcmInstruction;
  };
  Transact: unknown;
  WithdrawAsset: MultiAsset[];
  ReserveAssetDeposited: MultiAsset[];
  DepositAsset: {
    beneficiary: {
      interior: {
        X1: {
          AccountId32: {
            id: string;
          };
          AccountKey20: {
            key: string;
          };
          Parachain: string;
        };
      };
    };
  };
  ReceiveTeleportedAsset: MultiAsset[];
  ExportMessage: unknown;
  QueryResponse: unknown;
}

interface XcmInstruction extends Partial<XcmInstructionSchema> {}
interface XcmInstructionXcm extends XcmInstruction {
  xcm: XcmInstruction[];
}

function isAssetId(object: any): object is RequireOnlyOne<AssetId> {
  return object.Concrete !== undefined || object.Abstract !== undefined;
}

// WARN: this should be extracted to production rules kb
// eslint-disable-next-line complexity
export function humanize(journey: XcmJourney): HumanizedXcm {
  const { sender, origin, destination } = journey;
  const version = Object.keys(
    origin.instructions as unknown as VersionedXcm,
  )[0];
  const versioned: XcmInstruction[] = Object.values(
    origin.instructions as unknown as XcmInstructionXcm,
  )[0];
  const hopTransfer = versioned.find(
    (op) =>
      op.InitiateReserveWithdraw ||
      op.InitiateTeleport ||
      op.DepositReserveAsset ||
      op.TransferReserveAsset,
  );
  const bridgeMessage = versioned.find((op) => op.ExportMessage);

  let type = XcmJourneyType.Unknown;
  if (versioned.find((op) => op.Transact)) {
    type = XcmJourneyType.Transact;
  } else if (versioned.find((op) => op.QueryResponse)) {
    type = XcmJourneyType.QueryResponse;
  } else if (
    (versioned.find((op) => op.WithdrawAsset || op.ReserveAssetDeposited) &&
      versioned.find((op) => op.DepositAsset)) ||
    hopTransfer ||
    bridgeMessage
  ) {
    type = XcmJourneyType.Transfer;
  } else if (versioned.find((op) => op.ReceiveTeleportedAsset)) {
    type = XcmJourneyType.Teleport;
  }

  // Extract beneficiary
  let deposit = versioned.find((op) => op.DepositAsset !== undefined);
  if (hopTransfer) {
    deposit = (Object.values(hopTransfer)[0] as XcmInstructionXcm).xcm.find(
      (op) => op.DepositAsset !== undefined,
    );
  }
  if (bridgeMessage) {
    deposit = (Object.values(bridgeMessage)[0] as XcmInstructionXcm).xcm.find(
      (op) => op.DepositAsset !== undefined,
    );
  }

  let beneficiary = "unknown";

  if (deposit !== undefined) {
    const X1 = deposit.DepositAsset?.beneficiary.interior.X1;

    let maybeMultiAddress = X1;

    if (X1 && Array.isArray(X1)) {
      maybeMultiAddress = X1[0];
    }

    if (maybeMultiAddress?.AccountId32) {
      beneficiary = toAddress(
        maybeMultiAddress.AccountId32.id,
        destination.chainId,
      );
    } else if (maybeMultiAddress?.AccountKey20) {
      beneficiary = maybeMultiAddress.AccountKey20.key;
    } else if (maybeMultiAddress?.Parachain) {
      beneficiary = maybeMultiAddress.Parachain;
    }
  }

  // Extract assets
  const assets: XcmAsset[] = [];
  const _instruction = versioned.find(
    (op) =>
      op.ReserveAssetDeposited !== undefined ||
      op.ReceiveTeleportedAsset !== undefined ||
      op.WithdrawAsset !== undefined,
  );
  if (
    _instruction !== undefined &&
    (type === XcmJourneyType.Transfer || type === XcmJourneyType.Teleport) &&
    !hopTransfer &&
    !bridgeMessage // hops and bridged assets need to be handled differently T.T
  ) {
    const multiAssets =
      _instruction.ReserveAssetDeposited ||
      _instruction.ReceiveTeleportedAsset ||
      _instruction.WithdrawAsset;
    if (multiAssets !== undefined) {
      for (const multiAsset of multiAssets) {
        const { id, fun } = multiAsset;
        // non-fungible assets not supported
        if (fun.Fungible === undefined) {
          continue;
        }

        let multiLocation: XcmV3MultiLocation | undefined;
        if (isAssetId(id)) {
          multiLocation = id.Concrete;
        } else {
          multiLocation = id;
        }

        // abstract asset ids not supported
        if (multiLocation !== undefined) {
          assets.push({
            location: multiLocation,
            amount: fun.Fungible,
          });
        }
      }
    }
  }

  const signer = sender?.signer;
  const from = signer ? trunc(signer.id as string) : chainName(origin.chainId);
  const to = [XcmJourneyType.Teleport, XcmJourneyType.Transfer].includes(type)
    ? trunc(beneficiary)
    : chainName(destination.chainId);

  return {
    type,
    from,
    to,
    assets,
    version: version.toLowerCase() as XcmVersion,
  };
}
