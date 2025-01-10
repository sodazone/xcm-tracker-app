import { chains } from "../chains";
import { chainName, trunc } from "../lib/utils";

export function AddressWithLink({
  address,
  chainId,
}: { address: string | null; chainId: string }) {
  const subscan = chains[chainId]?.subscanLink;
  const link = subscan && address ? `${subscan}/account/${address}` : undefined;
  return (
    <a
      target="_blank"
      href={link}
      className={`${link ? "hover:underline" : ""} flex space-x-1 text-sm items-center text-gray-300`}
    >
      <span>{address ? trunc(address) : chainName(chainId)}</span>
    </a>
  );
}
