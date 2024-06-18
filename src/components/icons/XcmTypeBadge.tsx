import { XcmJourneyType } from "../../lib/kb";

export function getXcmTypeBadge(t: XcmJourneyType) {
  switch (t) {
    case XcmJourneyType.Transfer:
      return (
        <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-blue-900 text-blue-300">
          {t}
        </span>
      );
    case XcmJourneyType.Teleport:
      return (
        <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-purple-900 text-purple-300">
          {t}
        </span>
      );
    case XcmJourneyType.Transact:
      return (
        <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-yellow-900 text-yellow-300">
          {t}
        </span>
      );
    case XcmJourneyType.QueryResponse:
      return (
        <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-pink-900 text-pink-300">
          {t}
        </span>
      );
    default:
      return (
        <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-gray-700 text-gray-300">
          {t}
        </span>
      );
  }
}
