import { getLikeActorId, readLocal } from "./core.js";

function readArray(key) {
  const value = readLocal(key);
  return Array.isArray(value) ? value : [];
}

export function createAppState() {
  const state = {
    lang: ["en", "km", "zh"].includes(localStorage.getItem("qipi:language")) ? localStorage.getItem("qipi:language") : "en",
    routes: [], trips: [], savedTripRecords: [], filter: "", search: "", me: null, view: "feed",
    likeActorId: getLikeActorId(), profile: null, profileId: "", profileUsername: "", profileReturnView: "feed", profileEditing: false, profileTab: "posts", savedLoading: false, savedError: false, savedRequestId: 0,
    profileRequestId: 0, routeRequestId: 0, tripRequestId: 0, startupDeepLink: null,
    conversationId: "", conversations: [], messages: [], messageRequestId: 0, messagePoll: null, chatNotificationPoll: null,
    messageSearch: "", messagePeople: [], messageHistoryMatches: [], messageSearchLoading: false,
    feedRequestActive: false, pendingLikes: new Set(), pendingFollows: new Set(),
    profileSuggestions: [], profileSuggestionsLoading: true, profileSuggestionsRequestId: 0,
    savedTrips: readArray("qipi:saved-trips"),
    theme: window.qipiTheme?.getPreference() || "system",
    preferences: { defaultTransport: "motorbike", defaultCostStyle: "own", safetyReminders: true, ...readLocal("qipi:preferences") },
    hostKeys: readLocal("qipi:host-keys"), requestKeys: readLocal("qipi:request-keys"),
    recentSearches: readArray("qipi:recent-searches"),
    searchProfiles: [], searchFilters: { upcoming: false, routeId: "", transport: "" }
  };
  return state;
}
