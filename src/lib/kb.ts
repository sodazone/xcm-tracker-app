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

type InitiateReserveWithdraw = {
  assets: MultiAsset[];
  reserve: AnyJson;
  xcm: XcmInstruction[];
}

type InitiateTeleport =  {
  assets: MultiAsset[];
  dest: AnyJson;
  xcm: XcmInstruction[];
}

type DepositReserveAsset = InitiateTeleport
type TransferReserveAsset = InitiateTeleport

type ExportMessage = {
  xcm: XcmInstruction[]
}

type AccountId32 = {
  type: 'AccountId32'
  value: {
    id: string;
  }
}

type AccountKey20 = {
  type: 'AccountKey20'
  value: {
    key: string;
  }
}

type Parachain = {
  type: 'Parachain',
  value: string
}

type DepositAsset = {
  beneficiary: {
    interior: {
      type: string,
      value: AccountId32 | AccountKey20 | Parachain;
    };
  };
}

// type WithdrawAsset = MultiAsset[]
// type ReserveAssetDeposited = WithdrawAsset
// type ReceiveTeleportedAsset = WithdrawAsset

type XcmInstruction = {
  type: string,
  value: AnyJson
}

type XcmVersionedInstructions = {
  type: string,
  value: XcmInstruction[]
}

function isAssetId(object: any): object is RequireOnlyOne<AssetId> {
  return object.Concrete !== undefined || object.Abstract !== undefined;
}

// WARN: this should be extracted to production rules kb
// eslint-disable-next-line complexity
export function humanize(journey: XcmJourney): HumanizedXcm {
  const { sender, origin, destination } = journey;
  const version = (origin.instructions as unknown as XcmVersionedInstructions).type;
  const versioned = (
    origin.instructions as unknown as XcmVersionedInstructions
  ).value;
  const hopTransfer = versioned.find(
    (op) =>
      op.type === 'InitiateReserveWithdraw' ||
      op.type === 'InitiateTeleport' ||
      op.type === 'DepositReserveAsset' ||
      op.type === 'TransferReserveAsset',
  );
  const bridgeMessage = versioned.find((op) => op.type === 'ExportMessage');

  let type = XcmJourneyType.Unknown;
  if (versioned.find((op) => op.type === 'Transact')) {
    type = XcmJourneyType.Transact;
  } else if (versioned.find((op) => op.type === 'QueryResponse')) {
    type = XcmJourneyType.QueryResponse;
  } else if (
    (versioned.find((op) => op.type === 'WithdrawAsset' || op.type === 'ReserveAssetDeposited') &&
      versioned.find((op) => op.type === 'DepositAsset')) ||
    hopTransfer ||
    bridgeMessage
  ) {
    type = XcmJourneyType.Transfer;
  } else if (versioned.find((op) => op.type === 'ReceiveTeleportedAsset')) {
    type = XcmJourneyType.Teleport;
  }

  // Extract beneficiary
  let deposit = versioned.find((op) => op.type === 'DepositAsset');
  if (hopTransfer) {
    deposit = ((hopTransfer.value as unknown as InitiateTeleport | DepositReserveAsset | TransferReserveAsset | InitiateReserveWithdraw).xcm).find(
      (op) => op.type === 'DepositAsset',
    );
  }
  if (bridgeMessage) {
    deposit = (bridgeMessage.value as unknown as ExportMessage).xcm.find(
      (op) => op.type === 'DepositAsset'
    );
  }

  let beneficiary = "unknown";

  if (deposit !== undefined) {
    const interiorValue = (deposit.value as unknown as DepositAsset).beneficiary.interior.value;

    let maybeMultiAddress = interiorValue;

    if (interiorValue && Array.isArray(interiorValue)) {
      maybeMultiAddress = interiorValue[0];
    }

    if (maybeMultiAddress.type === 'AccountId32') {
      beneficiary = toAddress(
        maybeMultiAddress.value.id,
        destination.chainId,
      );
    } else if (maybeMultiAddress.type === 'AccountKey20') {
      beneficiary = maybeMultiAddress.value.key;
    } else if (maybeMultiAddress.type === 'Parachain') {
      beneficiary = maybeMultiAddress.value;
    }
  }

  // Extract assets
  const assets: XcmAsset[] = [];
  const _instruction = versioned.find(
    (op) =>
      op.type === 'ReserveAssetDeposited' !== undefined ||
      op.type === 'ReceiveTeleportedAsset' !== undefined ||
      op.type === 'WithdrawAsset' !== undefined,
  );
  if (
    _instruction !== undefined &&
    (type === XcmJourneyType.Transfer || type === XcmJourneyType.Teleport) &&
    !hopTransfer &&
    !bridgeMessage // hops and bridged assets need to be handled differently T.T
  ) {
    const multiAssets = _instruction.value as unknown as MultiAsset[]
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
