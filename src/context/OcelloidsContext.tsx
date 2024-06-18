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
  subscriptions: Subscription<xcm.XcmInputs>[];
  subscriptionId?: string;
  setSubscriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
  getSelectedSubscriptions: () => Subscription<xcm.XcmInputs>[];
};

const OcelloidsContext = React.createContext<OcelloidsContext>(
  {} as unknown as OcelloidsContext,
);

export function OcelloidsContextProvider({ children }: PropsWithChildren) {
  const client = useMemo(
    () =>
      new OcelloidsClient({
        httpUrl: "http://127.0.0.1:3000",
        wsUrl: "ws://127.0.0.1:3000",
      }),
    [],
  );

  const [subscriptions, setSubscriptions] = useState<
    Subscription<xcm.XcmInputs>[]
  >([]);
  const [subscriptionId, setSubscriptionId] = useState<string>();

  useEffect(() => {
    async function getSubscriptions() {
      const subs = await client.agent<xcm.XcmInputs>("xcm").allSubscriptions();

      setSubscriptions(subs);
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
