import { steward } from "@sodazone/ocelloids-client";
import { useEffect, useState } from "react";
import { useOcelloidsContext } from "../context/OcelloidsContext";
import { HumanizedXcm, XcmAsset, XcmVersion } from "../lib/kb";

type Asset = {
  amount: bigint;
  decimals: number;
  symbol: string;
};

export function useFormattedAssets(chainId: string, humanized?: HumanizedXcm) {
  const { client } = useOcelloidsContext();
  const [formattedAssets, setFormattedAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const formatted: Asset[] = [];

    async function queryAssetsMetadata(
      assets: XcmAsset[],
      version?: XcmVersion,
    ) {
      const locations = assets.map((a) =>
        JSON.stringify(a.location, (_, value) =>
          typeof value === "string" ? value.replaceAll(",", "") : value,
        ),
      );

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
              amount: BigInt(assets[index].amount.replaceAll(",", "")),
              decimals: metadata.decimals || 0,
              symbol: metadata.symbol || "TOKEN",
            });
          }
        }
        setFormattedAssets(formatted);
      } catch (error) {
        console.error(error);
      }
    }

    if (humanized?.assets) {
      queryAssetsMetadata(humanized.assets, humanized.version);
    }
  }, [humanized, client, chainId]);

  return formattedAssets;
}
