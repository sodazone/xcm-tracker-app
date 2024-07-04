import { OcelloidsClient, Subscription, xcm } from "@sodazone/ocelloids-client";
import React, {
  useContext,
  PropsWithChildren,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";

type OcelloidsContext = {
  client: OcelloidsClient;
  loading: boolean;
  subscriptions: Subscription<xcm.XcmInputs>[];
  subscriptionId?: string;
  setSubscriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
  getSelectedSubscriptions: () => Subscription<xcm.XcmInputs>[];
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

  const [subscriptions, setSubscriptions] = useState<
    Subscription<xcm.XcmInputs>[]
  >([]);
  const [subscriptionId, setSubscriptionId] = useState<string>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function getSubscriptions() {
      const subs = await client.agent<xcm.XcmInputs>("xcm").allSubscriptions();
      const wsSubs = subs.filter((s) =>
        s.channels.some((chan) => chan.type === "websocket"),
      );
      setSubscriptions(wsSubs);
      setLoading(false);
    }

    getSubscriptions();
  }, [client]);

  const getSelectedSubscriptions = useCallback(() => {
    return subscriptionId === "all"
      ? subscriptions
      : subscriptions.filter((s) => s.id === subscriptionId);
  }, [subscriptionId, subscriptions]);

  const state = {
    client,
    loading,
    subscriptions,
    subscriptionId,
    setSubscriptionId,
    getSelectedSubscriptions,
  };

  return (
    <OcelloidsContext.Provider value={state}>
      {children}
    </OcelloidsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useOcelloidsContext = () => useContext(OcelloidsContext);
