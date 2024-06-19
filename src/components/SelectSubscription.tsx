import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { EllipsisHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useOcelloidsContext } from "../context/OcelloidsContext";
import { chainName, trunc } from "../lib/utils";
import { getIconChain } from "./icons/ChainIcon";

function uniques<T>(items: T[]) {
  const f = items.flat();
  return Array.from(new Set(f.values()));
}

export function SelectSubscription() {
  const {
    subscriptionId,
    setSubscriptionId,
    subscriptions,
    getSelectedSubscriptions,
  } = useOcelloidsContext();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  function getOriginChainName(id: string) {
    if (id === "all") {
      return "All networks";
    }
    const sub = subscriptions.find((s) => s.id === id);
    return sub ? chainName(sub.args.origin) : undefined;
  }

  if (!subscriptions) {
    return null;
  }

  const subs = getSelectedSubscriptions();

  const origins = uniques(subs.map((s) => s.args.origin));
  const destinations = uniques(subs.map((s) => s.args.destinations));
  const senders = uniques(subs.map((s) => s.args.senders ?? "*"));

  const menu = (
    <Menu>
      <MenuButton className="flex flex-grow p-4">
        <div className="flex w-full items-center space-x-2 text-gray-300">
          <span className="capitalize">
            {subscriptionId
              ? getOriginChainName(subscriptionId)
              : "Select network"}
          </span>
          <ChevronDownIcon className="size-5 text-gray-500" />
        </div>
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="flex flex-col backdrop-blur-xl w-full origin-top-right border border-white/5 bg-white/5 p-1 text-white [--anchor-gap:var(--spacing-1)] focus:outline-none md:w-[var(--button-width)]"
      >
        <MenuItem key="all">
          <button
            className="p-2 text-left data-[focus]:bg-white/10"
            onClick={() => setSubscriptionId("all")}
          >
            All networks
          </button>
        </MenuItem>
        {subscriptions.map((s) => {
          return (
            <MenuItem key={s.id}>
              <button
                className="p-2 text-left data-[focus]:bg-white/10"
                onClick={() => setSubscriptionId(s.id)}
              >
                <span className="capitalize">{chainName(s.args.origin)}</span>
              </button>
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );

  return subscriptionId ? (
    <>
      <div className="w-full flex items-center divide-x divide-gray-900 border-b border-gray-900 bg-gray-900 bg-opacity-90">
        {menu}
        <button
          className="p-4 text-gray-500 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <XMarkIcon className="size-6" />
          ) : (
            <EllipsisHorizontalIcon className="size-6" />
          )}
        </button>
      </div>
      <div
        className={`${menuOpen ? "flex" : "hidden"} isolate flex-col w-full text-sm text-gray-400 px-4 border-b border-gray-900 bg-gray-900 bg-opacity-90 md:divide-x md:divide-gray-900 md:items-center md:flex-row md:space-x-3 md:flex`}
      >
        <div className="flex flex-col space-y-2 pb-2 pt-2 md:pt-0 md:items-center">
          <span className="uppercase font-semibold">Origins</span>
          <span className="flex -space-x-1">
            {origins.map((origin) => getIconChain(origin))}
          </span>
        </div>
        <div className="flex flex-col space-y-2 pb-2 md:pl-3 md:items-center">
          <span className="uppercase font-semibold">Destinations</span>
          <span className="flex -space-x-1">
            {destinations.map((destination) => getIconChain(destination))}
          </span>
        </div>
        <div className="flex flex-col space-y-2 pb-2 md:pl-3 md:items-center">
          <span className="uppercase font-semibold">Senders</span>
          <span className="text-gray-200">
            {senders.map((s) => trunc(s)).join(",")}
          </span>
        </div>
      </div>
    </>
  ) : (
    <div
      className="flex flex-col py-20 px-4 h-full bg-gray-900 bg-opacity-30 text-lg text-gray-300 items-center"
      onClick={() => setMenuOpen(!menuOpen)}
    >
      <span className="text-center">
        Please select a network to start tracking XCM journeys
      </span>
      <span className="w-fit border border-gray-300 mt-12">{menu}</span>
    </div>
  );
}
