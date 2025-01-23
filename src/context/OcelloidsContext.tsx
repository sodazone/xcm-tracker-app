import { OcelloidsClient, Subscription, xcm } from "@sodazone/ocelloids-client";
import React, {
  useContext,
  PropsWithChildren,
  useEffect,
  useState,
  useMemo,
} from "react";

type OcelloidsContext = {
  client: OcelloidsClient;
  loading: boolean;
  subscription: Subscription<xcm.XcmInputs> | undefined;
  networks: string[];
};

const OcelloidsContext = React.createContext<OcelloidsContext>(
  {} as unknown as OcelloidsContext,
);

const httpUrl = import.meta.env.VITE_API_HTTP_URL ?? "http://127.0.0.1:3000";
const wsUrl = import.meta.env.VITE_API_WS_URL ?? "ws://127.0.0.1:3000";
const apiKey = import.meta.env.VITE_API_KEY;

export function OcelloidsContextProvider({ children }: PropsWithChildren) {
  const client = useMemo(
    () =>
      new OcelloidsClient({
        httpUrl,
        wsUrl,
        apiKey,
      }),
    [],
  );

  const [subscription, setSubscription] = useState<
    Subscription<xcm.XcmInputs> | undefined
  >();
  const [networks, setNetworks] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function getSubscriptions() {
      const subs = await client.agent<xcm.XcmInputs>("xcm").allSubscriptions();
      const wsSub = subs.find(
        (s) =>
          s.args.destinations === "*" &&
          s.args.origins === "*" &&
          s.channels.some((chan) => chan.type === "websocket"),
      );
      const networks = await client.networks();
      setNetworks(networks);
      setSubscription(wsSub);
      setLoading(false);
    }

    getSubscriptions();
  }, [client]);

  const state = {
    client,
    loading,
    subscription,
    networks,
  };

  return (
    <OcelloidsContext.Provider value={state}>
      {children}
    </OcelloidsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useOcelloidsContext = () => useContext(OcelloidsContext);
