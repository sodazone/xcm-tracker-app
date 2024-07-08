import { steward } from "@sodazone/ocelloids-client";
import { useEffect, useState } from "react";
import { useOcelloidsContext } from "../context/OcelloidsContext";
import { HumanizedXcm, XcmVersion } from "../lib/kb";
import { getStorageObject, setLocalStorage } from "../lib/utils";

type Asset = {
  amount: bigint;
  decimals: number;
  symbol: string;
};

type AssetQueryData = {
  location: string;
  amount: bigint;
  version?: XcmVersion;
};

type StoredMetadata = {
  data: NonNullable<steward.AssetMetadata>;
  lastUpdated: number;
};

function needsUpdate(lastUpdated: number) {
  return Date.now() - lastUpdated > 24 * 60 * 60 * 1000;
}

export function useFormattedAssets(chainId: string, humanized?: HumanizedXcm) {
  const { client } = useOcelloidsContext();
  const [formattedAssets, setFormattedAssets] = useState<Asset[]>([]);
  const [assetQueryData, setAssetQueryData] = useState<AssetQueryData[]>([]);

  useEffect(() => {
    if (humanized?.assets && humanized?.assets.length > 0) {
      const formatted: Asset[] = [];
      const queryData: AssetQueryData[] = [];
      for (const asset of humanized.assets) {
        const location = JSON.stringify(asset.location, (_, value) =>
          typeof value === "string" ? value.replaceAll(",", "") : value,
        );
        const amount = BigInt(asset.amount.replaceAll(",", ""));
        const key = `asset-${chainId}-${location}`;
        const stored = getStorageObject<StoredMetadata>(key);
        if (stored && !needsUpdate(stored.lastUpdated)) {
          formatted.push({
            amount,
            decimals: stored.data.decimals || 0,
            symbol: stored.data.symbol || "TOKEN",
          });
        } else {
          queryData.push({
            location,
            amount,
            version: humanized.version,
          });
        }
      }
      setFormattedAssets(formatted);
      setAssetQueryData(queryData);
    }
  }, [humanized, chainId]);

  useEffect(() => {
    const formatted: Asset[] = [];

    async function queryAssetsMetadata(assetQueryData: AssetQueryData[]) {
      const version = assetQueryData[0].version;
      const locations = assetQueryData.map((d) => d.location);
      try {
        const { items } = await client
          .agent("steward")
          .query<steward.StewardQueryArgs, steward.AssetMetadata>({
            op: "assets.metadata.by_location",
            criteria: [
              {
                network: chainId,
                locations,
                version,
              },
            ],
          });

        for (const [index, metadata] of items.entries()) {
          if (metadata !== null) {
            formatted.push({
              amount: assetQueryData[index].amount,
              decimals: metadata.decimals || 0,
              symbol: metadata.symbol || "TOKEN",
            });

            const key = `asset-${chainId}-${assetQueryData[index].location}`;
            setLocalStorage<StoredMetadata>(key, {
              data: metadata,
              lastUpdated: Date.now(),
            });
          } else {
            // unknown token
            formatted.push({
              amount: assetQueryData[index].amount,
              decimals: 0,
              symbol: "TOKEN",
            });
          }
        }
        setFormattedAssets((prev) => prev.concat(formatted));
      } catch (error) {
        console.error(error);
      }
    }

    if (assetQueryData.length > 0) {
      queryAssetsMetadata(assetQueryData);
    }
  }, [assetQueryData, client, chainId]);

  return formattedAssets;
}
