import { QipiAuth } from "./auth.js";

const icon = (name, className = "heroicon") => `<svg class="${className}" aria-hidden="true"><use href="/icons.svg#${name}"></use></svg>`;

const copy = {
  en: {
    navRoutes: "Routes", navTrips: "Upcoming trips", navHow: "How it works", myTrips: "My trips", postTrip: "Post a trip",
    heroEyebrow: "Seven days. Two made for going.", heroTitleA: "Make the weekend", heroTitleB: "a story.",
    heroIntro: "Practical routes for Cambodia. Real trips with people going your way. Start with Kampot, Kep and Bokor.",
    exploreRoutes: "Explore routes", findTrip: "Find a trip", heroFootnote: "Qi is 7 in Chinese. Pi is 2 in Khmer. Your weekend starts here.",
    mapPilot: "PILOT AREA · SOUTH COAST", mapCaption: "Three ways to make the journey yours.",
    valueRoutes: "Routes with context", valuePeople: "People heading there", valueUpdates: "Fresh notes from the road",
    routesKicker: "CHOOSE YOUR DIRECTION", routesTitle: "Start with a route.", routesSubtitle: "These guides are a starting point. Check live conditions before you leave.",
    tripsKicker: "GO WITH GOOD COMPANY", tripsTitle: "Find your next crew.", tripsSubtitle: "See who's going, or invite others on your own route.",
    filterByRoute: "Filter by route", allRoutes: "All routes", postYourTrip: "Post your trip",
    howKicker: "SIMPLE BY DESIGN", howTitle: "From idea to open road.",
    stepOneTitle: "Choose a route", stepOneBody: "Get the shape of the trip, useful stops and what to check before leaving.",
    stepTwoTitle: "Find your people", stepTwoBody: "Post a trip or ask to join one that fits your dates and travel style.",
    stepThreeTitle: "Bring back a note", stepThreeBody: "Share a recent route update so the next group can plan better.",
    closingKicker: "THE FIRST MILES START HERE", closingTitle: "Have a date in mind?", closingBody: "Put your trip on the board and see who wants to come along.",
    footerNote: "Seven days in a week. Two days to make the weekend count.", moderation: "Moderation",
    viewRoute: "View route", routeGuide: "ROUTE GUIDE", routeStops: "Suggested stops", costChecklist: "Cost checklist",
    routeNote: "Before you go", routeSource: "Planning reference", reviewed: "Reviewed", openMap: "Open in Maps",
    findTripsHere: "Find trips on this route", addRouteNote: "Add a route note", recentNotes: "Recent road notes",
    noNotes: "No approved notes yet. Be the first to share what you found.", reportRoute: "Report route information",
    routeNotLive: "Guides are for planning. Road, weather and access conditions can change on the day.",
    tripBoardEmptyTitle: "The board is waiting for its first trip.", tripBoardEmptyBody: "Have a weekend plan? Share the date and route so others can join.",
    spots: "places left", viewTrip: "View trip", hostedBy: "Hosted by", startsAt: "Starts at", meetingArea: "Meeting area",
    aboutTrip: "About this trip", joinTrip: "Request to join", manageRequests: "Manage requests", closeTrip: "Close trip",
    closedTrip: "This trip is closed", fullTrip: "This trip is full", requestPending: "Your request is pending",
    requestApproved: "Your request was approved", requestDeclined: "Your request was declined",
    noContact: "This demo does not collect phone numbers or share live locations. Arrange meeting details directly once both people agree.",
    requestList: "Join requests", noRequests: "No requests yet.", approve: "Approve", decline: "Decline",
    shareTrip: "Share trip link", reportTrip: "Report this trip", tripClosed: "Trip closed", confirmClose: "Close this trip to new requests?",
    createTitle: "Post your trip", createIntro: "Tell others where and when you plan to go. Keep your meeting point general until you agree to travel together.",
    yourName: "Your name or nickname", tripTitle: "Trip title", route: "Route", travelDate: "Travel date", departureTime: "Departure time",
    transport: "Transport", motorbike: "Motorbike", car: "Car", mixed: "Mixed group", openPlaces: "Open places",
    meetingAreaLabel: "General meeting area", meetingAreaHint: "For example, Kampot town center. Avoid home addresses.",
    costStyle: "Costs", ownCosts: "Everyone covers their own", sharedCosts: "Share fuel or group costs", freeTrip: "No shared costs",
    tripNotes: "Trip plan and expectations", tripNotesHint: "What kind of pace, stops or rider experience should people know about?",
    createTripButton: "Publish trip", hostDeviceNote: "You can manage this trip from this browser. Keep this device's local data until your trip is over.",
    joinTitle: "Ask to join", joinIntro: "Introduce yourself to the trip host. Your request stays private until they decide.",
    travelerName: "Your name or nickname", shortMessage: "Short message (optional)", sendRequest: "Send request",
    myTitle: "My trips & requests", myIntro: "Trips and requests created in this browser appear here.",
    hosting: "Trips you're hosting", joining: "Requests you've sent", noHosted: "No trips posted from this browser yet.",
    noJoined: "No join requests sent from this browser yet.", open: "Open", closed: "Closed",
    updateTitle: "Share a route note", updateIntro: "What did you actually see? Updates are reviewed before appearing publicly.",
    visitDate: "Date you traveled", condition: "How was the route?", good: "Good", mixedCondition: "Mixed", caution: "Use caution",
    routeUpdateNote: "What changed or helped?", submitUpdate: "Send note for review",
    reportTitle: "Report a concern", reportIntro: "Help us review inaccurate, unsafe or unwanted content.",
    reason: "Reason", inaccurate: "Inaccurate information", unsafe: "Safety concern", spam: "Spam or abuse", other: "Other",
    details: "Details (optional)", sendReport: "Send report", loading: "Loading…", retry: "Try again",
    saveSuccess: "Trip posted. Share its link with your group.", requestSuccess: "Request sent to the trip host.",
    decisionSuccess: "Request updated.", updateSuccess: "Thank you. Your note is waiting for review.", reportSuccess: "Thank you. Your report was received.",
    copied: "Link copied", failed: "Something went wrong. Please try again.", noTripsFilter: "No upcoming trips match this route yet."
  },
  km: {
    navRoutes: "ផ្លូវដំណើរ", navTrips: "ដំណើរខាងមុខ", navHow: "របៀបប្រើ", myTrips: "ដំណើររបស់ខ្ញុំ", postTrip: "បង្ហោះដំណើរ",
    heroEyebrow: "មួយសប្ដាហ៍មាន ៧ ថ្ងៃ។ ២ ថ្ងៃសម្រាប់ចេញដំណើរ។", heroTitleA: "ធ្វើឱ្យចុងសប្ដាហ៍", heroTitleB: "ក្លាយជារឿងរ៉ាវ។",
    heroIntro: "ផ្លូវដំណើរដែលមានប្រយោជន៍នៅកម្ពុជា និង ដំណើរជាមួយអ្នកដែលទៅទិសដៅដូចគ្នា។ ចាប់ផ្ដើមពីកំពត កែប និង បូកគោ។",
    exploreRoutes: "មើលផ្លូវដំណើរ", findTrip: "ស្វែងរកដំណើរ", heroFootnote: "Qi មានន័យថា ៧ ជាភាសាចិន។ Pi មានន័យថា ២ ជាភាសាខ្មែរ។ ចុងសប្ដាហ៍របស់អ្នកចាប់ផ្ដើមនៅទីនេះ។",
    mapPilot: "តំបន់សាកល្បង · ឆ្នេរខាងត្បូង", mapCaption: "បីរបៀបសម្រាប់ដំណើររបស់អ្នក។",
    valueRoutes: "ផ្លូវដែលមានព័ត៌មានលម្អិត", valuePeople: "អ្នកដែលធ្វើដំណើរទៅទីនោះ", valueUpdates: "ព័ត៌មានថ្មីពីអ្នកធ្វើដំណើរ",
    routesKicker: "ជ្រើសរើសទិសដៅ", routesTitle: "ចាប់ផ្ដើមពីផ្លូវមួយ។", routesSubtitle: "មគ្គុទ្ទេសក៍ទាំងនេះសម្រាប់រៀបចំដំណើរ។ សូមពិនិត្យស្ថានភាពផ្ទាល់មុនចេញ។",
    tripsKicker: "ទៅជាមួយមិត្តរួមដំណើរ", tripsTitle: "រកក្រុមដំណើរបន្ទាប់។", tripsSubtitle: "មើលអ្នកដែលមានគម្រោងទៅ ឬ អញ្ជើញអ្នកផ្សេងឱ្យចូលរួមដំណើររបស់អ្នក។",
    filterByRoute: "ច្រោះតាមផ្លូវ", allRoutes: "ផ្លូវទាំងអស់", postYourTrip: "បង្ហោះដំណើររបស់អ្នក",
    howKicker: "ងាយស្រួលប្រើ", howTitle: "ពីគំនិតទៅផ្លូវធ្វើដំណើរ។",
    stepOneTitle: "ជ្រើសរើសផ្លូវ", stepOneBody: "មើលផែនការដំណើរ កន្លែងឈប់ និង អ្វីដែលត្រូវពិនិត្យមុនចេញ។",
    stepTwoTitle: "រកមិត្តរួមដំណើរ", stepTwoBody: "បង្ហោះដំណើរ ឬ ស្នើសុំចូលរួមដំណើរដែលសមនឹងកាលបរិច្ឆេទរបស់អ្នក។",
    stepThreeTitle: "ចែករំលែកព័ត៌មានថ្មី", stepThreeBody: "ប្រាប់ពីស្ថានភាពផ្លូវដែលអ្នកបានជួប ដើម្បីជួយក្រុមបន្ទាប់។",
    closingKicker: "ដំណើរចាប់ផ្ដើមទីនេះ", closingTitle: "មានកាលបរិច្ឆេទក្នុងចិត្តហើយឬនៅ?", closingBody: "បង្ហោះគម្រោងរបស់អ្នក ហើយមើលអ្នកដែលចង់ចូលរួម។",
    footerNote: "មួយសប្ដាហ៍មាន ៧ ថ្ងៃ។ ២ ថ្ងៃសម្រាប់ធ្វើឱ្យចុងសប្ដាហ៍មានន័យ។", moderation: "ការត្រួតពិនិត្យ",
    viewRoute: "មើលផ្លូវ", routeGuide: "មគ្គុទ្ទេសក៍ផ្លូវ", routeStops: "កន្លែងឈប់ដែលបានណែនាំ", costChecklist: "ចំណាយត្រូវគិត",
    routeNote: "មុនចេញដំណើរ", routeSource: "ប្រភពសម្រាប់រៀបចំដំណើរ", reviewed: "បានពិនិត្យ", openMap: "បើកផែនទី",
    findTripsHere: "រកដំណើរតាមផ្លូវនេះ", addRouteNote: "បន្ថែមព័ត៌មានផ្លូវ", recentNotes: "ព័ត៌មានថ្មីពីផ្លូវ",
    noNotes: "មិនទាន់មានព័ត៌មានដែលបានអនុម័តទេ។ ចែករំលែកអ្វីដែលអ្នកបានជួប។", reportRoute: "រាយការណ៍ព័ត៌មានផ្លូវ",
    routeNotLive: "មគ្គុទ្ទេសក៍សម្រាប់រៀបចំដំណើរ។ ផ្លូវ អាកាសធាតុ និង ការចូលទៅកាន់ទីតាំងអាចប្រែប្រួល។",
    tripBoardEmptyTitle: "នៅមិនទាន់មានដំណើរទេ។", tripBoardEmptyBody: "មានគម្រោងចុងសប្ដាហ៍ឬ? ចែករំលែកកាលបរិច្ឆេទ និង ផ្លូវដើម្បីឱ្យអ្នកផ្សេងចូលរួម។",
    spots: "កន្លែងនៅសល់", viewTrip: "មើលដំណើរ", hostedBy: "អ្នករៀបចំ", startsAt: "ចេញម៉ោង", meetingArea: "តំបន់ជួបគ្នា",
    aboutTrip: "អំពីដំណើរនេះ", joinTrip: "ស្នើសុំចូលរួម", manageRequests: "គ្រប់គ្រងសំណើ", closeTrip: "បិទដំណើរ",
    closedTrip: "ដំណើរនេះបានបិទ", fullTrip: "ដំណើរនេះពេញហើយ", requestPending: "សំណើរបស់អ្នកកំពុងរង់ចាំ",
    requestApproved: "សំណើរបស់អ្នកត្រូវបានយល់ព្រម", requestDeclined: "សំណើរបស់អ្នកត្រូវបានបដិសេធ",
    noContact: "គំរូនេះមិនប្រមូលលេខទូរស័ព្ទ ឬ ចែករំលែកទីតាំងផ្ទាល់ទេ។ សូមព្រមព្រៀងព័ត៌មានជួបគ្នាដោយផ្ទាល់។",
    requestList: "សំណើចូលរួម", noRequests: "មិនទាន់មានសំណើទេ។", approve: "យល់ព្រម", decline: "បដិសេធ",
    shareTrip: "ចែករំលែកតំណដំណើរ", reportTrip: "រាយការណ៍ដំណើរនេះ", tripClosed: "ដំណើរបានបិទ", confirmClose: "បិទដំណើរនេះមិនឱ្យមានសំណើថ្មីឬ?",
    createTitle: "បង្ហោះដំណើររបស់អ្នក", createIntro: "ប្រាប់អ្នកផ្សេងពីទីកន្លែង និង ពេលវេលា។ សូមប្រើតំបន់ជួបទូទៅរហូតដល់ភាគីទាំងពីរយល់ព្រម។",
    yourName: "ឈ្មោះ ឬ ឈ្មោះហៅក្រៅ", tripTitle: "ចំណងជើងដំណើរ", route: "ផ្លូវដំណើរ", travelDate: "កាលបរិច្ឆេទ", departureTime: "ម៉ោងចេញ",
    transport: "យានជំនិះ", motorbike: "ម៉ូតូ", car: "រថយន្ត", mixed: "ក្រុមចម្រុះ", openPlaces: "កន្លែងទំនេរ",
    meetingAreaLabel: "តំបន់ជួបគ្នាទូទៅ", meetingAreaHint: "ឧទាហរណ៍ កណ្ដាលក្រុងកំពត។ កុំបញ្ចូលអាសយដ្ឋានផ្ទះ។",
    costStyle: "ការចំណាយ", ownCosts: "ម្នាក់ៗចំណាយខ្លួនឯង", sharedCosts: "ចែកថ្លៃប្រេង ឬ ចំណាយក្រុម", freeTrip: "គ្មានចំណាយរួម",
    tripNotes: "ផែនការ និង អ្វីដែលគួរដឹង", tripNotesHint: "ល្បឿនដំណើរ កន្លែងឈប់ ឬ បទពិសោធន៍ដែលអ្នកចូលរួមគួរដឹង។",
    createTripButton: "បង្ហោះដំណើរ", hostDeviceNote: "អ្នកអាចគ្រប់គ្រងដំណើរនេះពីកម្មវិធីរុករកនេះ។ សូមរក្សាទិន្នន័យមូលដ្ឋានរហូតដល់ដំណើរចប់។",
    joinTitle: "ស្នើសុំចូលរួម", joinIntro: "ណែនាំខ្លួនទៅអ្នករៀបចំដំណើរ។ សំណើរបស់អ្នកនៅឯកជនរហូតដល់គាត់សម្រេច។",
    travelerName: "ឈ្មោះ ឬ ឈ្មោះហៅក្រៅ", shortMessage: "សារខ្លី (មិនបាច់បំពេញ)", sendRequest: "ផ្ញើសំណើ",
    myTitle: "ដំណើរ និង សំណើរបស់ខ្ញុំ", myIntro: "ដំណើរ និង សំណើដែលបានបង្កើតក្នុងកម្មវិធីរុករកនេះបង្ហាញនៅទីនេះ។",
    hosting: "ដំណើរដែលអ្នករៀបចំ", joining: "សំណើដែលអ្នកបានផ្ញើ", noHosted: "អ្នកមិនទាន់បានបង្ហោះដំណើរពីកម្មវិធីរុករកនេះទេ។",
    noJoined: "អ្នកមិនទាន់បានផ្ញើសំណើចូលរួមពីកម្មវិធីរុករកនេះទេ។", open: "បើក", closed: "បិទ",
    updateTitle: "ចែករំលែកព័ត៌មានផ្លូវ", updateIntro: "តើអ្នកបានឃើញអ្វីពិតប្រាកដ? ព័ត៌មានត្រូវពិនិត្យមុនបង្ហាញជាសាធារណៈ។",
    visitDate: "ថ្ងៃដែលអ្នកបានធ្វើដំណើរ", condition: "ស្ថានភាពផ្លូវយ៉ាងដូចម្តេច?", good: "ល្អ", mixedCondition: "ចម្រុះ", caution: "គួរប្រុងប្រយ័ត្ន",
    routeUpdateNote: "មានអ្វីប្រែប្រួល ឬ មានប្រយោជន៍?", submitUpdate: "ផ្ញើព័ត៌មានឱ្យពិនិត្យ",
    reportTitle: "រាយការណ៍បញ្ហា", reportIntro: "ជួយយើងពិនិត្យព័ត៌មានខុស បញ្ហាសុវត្ថិភាព ឬ មាតិកាមិនសមរម្យ។",
    reason: "មូលហេតុ", inaccurate: "ព័ត៌មានមិនត្រឹមត្រូវ", unsafe: "បញ្ហាសុវត្ថិភាព", spam: "សារឥតបានការ", other: "ផ្សេងទៀត",
    details: "ព័ត៌មានលម្អិត (មិនបាច់បំពេញ)", sendReport: "ផ្ញើរបាយការណ៍", loading: "កំពុងទាញយក…", retry: "សាកម្ដងទៀត",
    saveSuccess: "ដំណើរបានបង្ហោះ។ ចែករំលែកតំណជាមួយក្រុមរបស់អ្នក។", requestSuccess: "សំណើបានផ្ញើទៅអ្នករៀបចំ។",
    decisionSuccess: "សំណើបានធ្វើបច្ចុប្បន្នភាព។", updateSuccess: "អរគុណ។ ព័ត៌មានរបស់អ្នកកំពុងរង់ចាំការពិនិត្យ។", reportSuccess: "អរគុណ។ យើងបានទទួលរបាយការណ៍។",
    copied: "បានចម្លងតំណ", failed: "មានបញ្ហា។ សូមសាកម្តងទៀត។", noTripsFilter: "មិនទាន់មានដំណើរខាងមុខសម្រាប់ផ្លូវនេះទេ។"
  },
  zh: {}
};

Object.assign(copy.en, {
  home: "Home", saved: "Saved", profile: "Profile", signIn: "Sign in", signOut: "Sign out",
  signUp: "Create account", create: "Create", createPost: "Your next trip is better shared.", searchPlaceholder: "Search routes and trips",
  guestTraveler: "Guest traveler", joinCommunity: "Join the Qipi community",
  railNoteTitle: "Your next story starts nearby.", railNoteBody: "Plan a route, meet a crew, and make two days count.",
  feedEyebrow: "CAMBODIA TRAVEL COMMUNITY", feedTitle: "Make the weekend a story.",
  feedIntro: "Find your next route and the people heading your way.", exploreFeed: "Explore the feed",
  composerPrompt: "Where are you going this weekend?", feedFilterLabel: "See plans from the community",
  weekendLabel: "THE QIPI IDEA", weekendStory: "Qi is seven in Chinese. Pi is two in Khmer. The weekend is yours to explore.",
  days: "days", daysToGo: "days to go.",
  popularNow: "Popular now", kampotTag: "Riverside starts", kepTag: "Coastal detours", bokorTag: "Mountain air",
  travelThoughtfully: "Travel thoughtfully", safetyCopy: "Keep meeting areas general, check live conditions and agree on plans before you go.",
  howBody: "Browse the route, say hello to the host, then bring a useful note back for the next traveler.",
  authIntro: "Join Cambodia's weekend travel community. Browse freely; sign in to post and connect.",
  authBrand: "CAMBODIA TRAVEL COMMUNITY", authHeadingSignIn: "Welcome back",
  authHeadingSignUp: "Create your account", authHeadingRecover: "Recover your account",
  authHeadingReset: "Choose a new password",
  authDescriptionSignIn: "Sign in to share plans, find travel companions and keep your trips together.",
  authDescriptionSignUp: "Create an account to post a trip, meet travelers and save your plans.",
  authDescriptionRecover: "Enter your email and we’ll send you a secure password reset link.",
  authDescriptionReset: "Set a new password to get back to your Qipi account.",
  authPrivacy: "Your email is used for sign-in and is never shown on trip posts.",
  email: "Email", password: "Password", displayName: "Name or nickname", haveAccount: "Already have an account?",
  needAccount: "New to Qipi?", forgotPassword: "Forgot password?", resetPassword: "Reset password",
  sendReset: "Send reset link", checkEmail: "Check your email for a confirmation link, then return to Qipi.",
  resetSent: "If this email has an account, a reset link is on its way.", passwordUpdated: "Password updated. You can keep exploring.",
  profileTitle: "Your Qipi profile", memberSince: "Signed in to the travel community",
  authUnavailable: "Sign-in is not configured for this local demo.", savedTrips: "Saved trips",
  noSaved: "No saved trips yet. Save a plan from the feed to find it here.", save: "Save", unsave: "Saved",
  discussTrip: "View trip", requestJoin: "Ask to join", member: "Qipi member", guestHost: "Traveler",
  routeFilterEmpty: "No routes match your search.", signInToContinue: "Sign in to continue.",
  routesKicker: "EXPLORE THE AREA", routesTitle: "Routes to explore", tripsKicker: "ON THE ROAD TOGETHER",
  tripsTitle: "The travel feed", howTitle: "Good trips begin together.",
  hostDeviceNote: "Your account lets you manage this trip across devices.",
  myIntro: "Trips you host and requests you send appear here when you sign in."
});
Object.assign(copy.km, {
  home: "ទំព័រដើម", saved: "បានរក្សាទុក", profile: "ប្រវត្តិរូប", signIn: "ចូលគណនី", signOut: "ចាកចេញ",
  signUp: "បង្កើតគណនី", create: "បង្កើត", createPost: "ដំណើររួមកាន់តែរីករាយ", searchPlaceholder: "ស្វែងរកផ្លូវ និង ដំណើរ",
  guestTraveler: "អ្នកធ្វើដំណើរថ្មី", joinCommunity: "ចូលរួមសហគមន៍ Qipi",
  railNoteTitle: "រឿងបន្ទាប់ចាប់ផ្ដើមនៅក្បែរអ្នក។", railNoteBody: "រៀបចំផ្លូវ ជួបមិត្តថ្មី និងធ្វើឱ្យពីរថ្ងៃមានន័យ។",
  feedEyebrow: "សហគមន៍ដំណើរកម្សាន្តកម្ពុជា", feedTitle: "ធ្វើឱ្យចុងសប្ដាហ៍ក្លាយជារឿងរ៉ាវ។",
  feedIntro: "ស្វែងរកផ្លូវ និង អ្នកដែលធ្វើដំណើរទៅទិសដៅដូចគ្នា។", exploreFeed: "មើលដំណើរ",
  composerPrompt: "ចុងសប្ដាហ៍នេះអ្នកទៅណា?", feedFilterLabel: "មើលគម្រោងពីសហគមន៍",
  weekendLabel: "គំនិត QIPI", weekendStory: "Qi មានន័យថា ប្រាំពីរ ជាភាសាចិន។ Pi មានន័យថា ពីរ ជាភាសាខ្មែរ។ ចុងសប្ដាហ៍ជាពេលចេញដំណើរ។",
  days: "ថ្ងៃ", daysToGo: "ថ្ងៃសម្រាប់ចេញដំណើរ",
  popularNow: "កំពុងពេញនិយម", kampotTag: "ចាប់ផ្ដើមក្បែរទន្លេ", kepTag: "ដំណើរតាមឆ្នេរ", bokorTag: "ខ្យល់ភ្នំ",
  travelThoughtfully: "ធ្វើដំណើរដោយប្រុងប្រយ័ត្ន", safetyCopy: "ជ្រើសតំបន់ជួបទូទៅ ពិនិត្យស្ថានភាពថ្មីៗ និងឯកភាពផែនការមុនចេញដំណើរ។",
  howBody: "មើលផ្លូវ សួរសុខទុក្ខអ្នករៀបចំ ហើយចែករំលែកព័ត៌មានមានប្រយោជន៍ទៅអ្នកបន្ទាប់។",
  authIntro: "ចូលរួមសហគមន៍ធ្វើដំណើរចុងសប្ដាហ៍។ អាចមើលដោយសេរី ហើយចូលគណនីដើម្បីបង្ហោះ។",
  authBrand: "សហគមន៍ធ្វើដំណើរកម្ពុជា", authHeadingSignIn: "សូមស្វាគមន៍មកវិញ",
  authHeadingSignUp: "បង្កើតគណនីរបស់អ្នក", authHeadingRecover: "សង្គ្រោះគណនីរបស់អ្នក",
  authHeadingReset: "កំណត់ពាក្យសម្ងាត់ថ្មី",
  authDescriptionSignIn: "ចូលគណនីដើម្បីចែករំលែកគម្រោង រកមិត្តរួមដំណើរ និងគ្រប់គ្រងដំណើររបស់អ្នក។",
  authDescriptionSignUp: "បង្កើតគណនីដើម្បីបង្ហោះដំណើរ ជួបអ្នកធ្វើដំណើរ និងរក្សាទុកគម្រោង។",
  authDescriptionRecover: "បញ្ចូលអ៊ីមែលរបស់អ្នក ដើម្បីទទួលតំណកំណត់ពាក្យសម្ងាត់ឡើងវិញ។",
  authDescriptionReset: "កំណត់ពាក្យសម្ងាត់ថ្មី ដើម្បីចូលប្រើគណនី Qipi របស់អ្នក។",
  authPrivacy: "អ៊ីមែលរបស់អ្នកប្រើសម្រាប់ចូលគណនី ហើយមិនបង្ហាញនៅលើដំណើរឡើយ។",
  email: "អ៊ីមែល", password: "ពាក្យសម្ងាត់", displayName: "ឈ្មោះ ឬ ឈ្មោះហៅក្រៅ", haveAccount: "មានគណនីហើយ?",
  needAccount: "ថ្មីនៅ Qipi?", forgotPassword: "ភ្លេចពាក្យសម្ងាត់?", resetPassword: "កំណត់ពាក្យសម្ងាត់ថ្មី",
  sendReset: "ផ្ញើតំណកំណត់ឡើងវិញ", checkEmail: "ពិនិត្យអ៊ីមែលដើម្បីបញ្ជាក់គណនី រួចត្រឡប់មក Qipi។",
  resetSent: "បើអ៊ីមែលនេះមានគណនី តំណកំណត់ឡើងវិញកំពុងផ្ញើទៅអ្នក។", passwordUpdated: "ពាក្យសម្ងាត់បានធ្វើបច្ចុប្បន្នភាព។",
  profileTitle: "ប្រវត្តិរូប Qipi", memberSince: "បានចូលក្នុងសហគមន៍ដំណើរ",
  authUnavailable: "ការចូលគណនីមិនទាន់បានកំណត់សម្រាប់គំរូមូលដ្ឋាននេះទេ។", savedTrips: "ដំណើរដែលបានរក្សាទុក",
  noSaved: "មិនទាន់មានដំណើរដែលបានរក្សាទុកទេ។", save: "រក្សាទុក", unsave: "បានរក្សាទុក",
  discussTrip: "មើលដំណើរ", requestJoin: "ស្នើសុំចូលរួម", member: "សមាជិក Qipi", guestHost: "អ្នកធ្វើដំណើរ",
  routeFilterEmpty: "មិនមានផ្លូវត្រូវនឹងការស្វែងរកទេ។", signInToContinue: "ចូលគណនីដើម្បីបន្ត។",
  routesKicker: "ស្វែងរកតំបន់", routesTitle: "ផ្លូវដំណើរគួរឱ្យស្វែងរក", tripsKicker: "ទៅជាមួយគ្នា",
  tripsTitle: "ដំណើរពីសហគមន៍", howTitle: "ដំណើរល្អចាប់ផ្ដើមជាមួយគ្នា។",
  hostDeviceNote: "គណនីរបស់អ្នកអាចគ្រប់គ្រងដំណើរនេះពីឧបករណ៍ផ្សេងបាន។",
  myIntro: "ដំណើរដែលអ្នករៀបចំ និងសំណើរបស់អ្នកបង្ហាញនៅទីនេះក្រោយចូលគណនី។"
});
Object.assign(copy.en, {
  entryTitle: "Make weekends better together.", entryIntro: "Sign in to post trips and connect with travelers, or continue as a guest to explore.", entryAccount: "Sign in or create an account", entryGuest: "Continue as guest",
  appearanceSettings: "Appearance", appearanceSettingsIntro: "Choose how Qipi looks on this device.", themeLabel: "Theme", themeSystem: "Use device setting", themeLight: "Light", themeDark: "Dark",
  travelPreferences: "Travel preferences", travelPreferencesIntro: "Set the defaults for trips you post.", defaultTransport: "Default transport", defaultCostStyle: "Default cost preference",
  safetySettings: "Safety and privacy", safetySettingsIntro: "Choose whether to show a reminder when you post.", safetyReminderSetting: "Trip privacy reminder", safetyReminderSettingCopy: "Remind me to keep home addresses and contact details off public posts.", safetyReminder: "Safety reminder: keep home addresses and contact details off public posts. Agree on an exact meeting point privately.",
  weekendPlan: "YOUR WEEKEND, YOUR WAY", stickyCreateTitle: "Have a trip in mind?", stickyCreateCopy: "Share your route and invite people to join.", createPostAction: "Create a post"
});
Object.assign(copy.km, {
  entryTitle: "ចុងសប្ដាហ៍កាន់តែរីករាយពេលទៅជាមួយគ្នា។", entryIntro: "ចូលគណនីដើម្បីបង្ហោះដំណើរ និង ជួបអ្នកធ្វើដំណើរ ឬ បន្តជាភ្ញៀវដើម្បីស្វែងរក។", entryAccount: "ចូលគណនី ឬ បង្កើតគណនី", entryGuest: "បន្តជាភ្ញៀវ",
  appearanceSettings: "រូបរាង", appearanceSettingsIntro: "ជ្រើសរើសរូបរាង Qipi នៅលើឧបករណ៍នេះ។", themeLabel: "ស្បែក", themeSystem: "ប្រើតាមឧបករណ៍", themeLight: "ភ្លឺ", themeDark: "ងងឹត",
  travelPreferences: "ចំណូលចិត្តធ្វើដំណើរ", travelPreferencesIntro: "កំណត់ជម្រើសដើមសម្រាប់ដំណើរដែលអ្នកបង្ហោះ។", defaultTransport: "មធ្យោបាយធ្វើដំណើរដើម", defaultCostStyle: "ចំណូលចិត្តចំណាយដើម",
  safetySettings: "សុវត្ថិភាព និង ឯកជនភាព", safetySettingsIntro: "ជ្រើសរើសថាតើត្រូវបង្ហាញការរំលឹកពេលបង្ហោះឬអត់។", safetyReminderSetting: "ការរំលឹកឯកជនភាពដំណើរ", safetyReminderSettingCopy: "រំលឹកខ្ញុំកុំបង្ហោះអាសយដ្ឋានផ្ទះ និង ព័ត៌មានទំនាក់ទំនងជាសាធារណៈ។", safetyReminder: "ការរំលឹកសុវត្ថិភាព៖ កុំបង្ហោះអាសយដ្ឋានផ្ទះ ឬ ព័ត៌មានទំនាក់ទំនងជាសាធារណៈ។ ព្រមព្រៀងទីតាំងជួបជាក់លាក់ដោយឯកជន។",
  weekendPlan: "ចុងសប្ដាហ៍តាមរបៀបអ្នក", stickyCreateTitle: "មានគម្រោងដំណើរហើយឬនៅ?", stickyCreateCopy: "ចែករំលែកផ្លូវ និងអញ្ជើញអ្នកផ្សេងចូលរួម។", createPostAction: "បង្កើតប្រកាស"
});
Object.assign(copy.zh, {
  entryTitle: "一起开启更精彩的周末。", entryIntro: "登录后发布行程并认识同行者，也可以访客身份继续浏览。", entryAccount: "登录或创建账号", entryGuest: "以访客身份继续",
  appearanceSettings: "外观", appearanceSettingsIntro: "选择此设备上的 Qipi 外观。", themeLabel: "主题", themeSystem: "跟随设备设置", themeLight: "浅色", themeDark: "深色",
  travelPreferences: "旅行偏好", travelPreferencesIntro: "设置发布行程时的默认选项。", defaultTransport: "默认交通方式", defaultCostStyle: "默认费用偏好",
  safetySettings: "安全与隐私", safetySettingsIntro: "选择发布行程时是否显示提醒。", safetyReminderSetting: "行程隐私提醒", safetyReminderSettingCopy: "提醒我不要在公开行程中发布家庭住址和联系方式。", safetyReminder: "安全提醒：不要在公开行程中发布家庭住址或联系方式。具体会合地点请私下商定。",
  weekendPlan: "按你的方式过周末", stickyCreateTitle: "已经有旅行计划了吗？", stickyCreateCopy: "分享路线，邀请其他人同行。", createPostAction: "创建帖子"
});

Object.assign(copy.en, {
  explore: "Explore", seeAll: "See all", forYou: "For you", settings: "Settings",
  accountSettings: "Account and profile", profileSettingsIntro: "Manage your Qipi profile.",
  languageSettings: "Language", languageSettingsIntro: "Choose the language used across Qipi.",
  displayLanguage: "Display language", profileName: "Profile name", saveProfile: "Save profile",
  guestProfileText: "Sign in to manage your account and profile.", backToFeed: "Back to feed",
  profileSaved: "Profile updated.", profileSaveError: "Could not update your profile. Try again.",
  notifications: "Notifications", allCaughtUp: "You're all caught up", noNotifications: "New activity will show up here.",
  feedLoadError: "Trips and routes could not load. Check your connection and try again."
});
Object.assign(copy.km, {
  explore: "ស្វែងរក", seeAll: "មើលទាំងអស់", forYou: "សម្រាប់អ្នក", settings: "ការកំណត់",
  accountSettings: "គណនី និង ប្រវត្តិរូប", profileSettingsIntro: "គ្រប់គ្រងប្រវត្តិរូប Qipi របស់អ្នក។",
  languageSettings: "ភាសា", languageSettingsIntro: "ជ្រើសរើសភាសាដែលប្រើនៅលើ Qipi។",
  displayLanguage: "ភាសាបង្ហាញ", profileName: "ឈ្មោះប្រវត្តិរូប", saveProfile: "រក្សាទុកប្រវត្តិរូប",
  guestProfileText: "ចូលគណនីដើម្បីគ្រប់គ្រងគណនី និង ប្រវត្តិរូប។", backToFeed: "ត្រឡប់ទៅព័ត៌មានថ្មីៗ",
  profileSaved: "បានធ្វើបច្ចុប្បន្នភាពប្រវត្តិរូប។", profileSaveError: "មិនអាចធ្វើបច្ចុប្បន្នភាពបានទេ។ សូមសាកម្តងទៀត។",
  notifications: "ការជូនដំណឹង", allCaughtUp: "អ្នកបានមើលទាំងអស់ហើយ", noNotifications: "សកម្មភាពថ្មីៗនឹងបង្ហាញនៅទីនេះ។",
  feedLoadError: "មិនអាចទាញយកដំណើរ និង ផ្លូវបានទេ។ សូមពិនិត្យការតភ្ជាប់ រួចសាកម្ដងទៀត។"
});
Object.assign(copy.zh, {
  home: "首页", saved: "已收藏", profile: "个人主页", signIn: "登录", signOut: "退出登录",
  signUp: "创建账号", create: "创建", createPost: "下一趟旅程，邀人同行。", searchPlaceholder: "搜索路线和行程",
  guestTraveler: "访客", navRoutes: "路线", navTrips: "行程", myTrips: "我的行程", postTrip: "发布行程",
  explore: "发现", seeAll: "查看全部", forYou: "为你推荐", settings: "设置",
  accountSettings: "账号与个人资料", profileSettingsIntro: "管理你的 Qipi 个人资料。",
  languageSettings: "语言", languageSettingsIntro: "选择 Qipi 使用的语言。", displayLanguage: "显示语言",
  profileName: "个人资料名称", saveProfile: "保存资料", guestProfileText: "登录以管理账号和个人资料。",
  backToFeed: "返回动态", profileSaved: "资料已更新。", profileSaveError: "无法更新资料，请重试。",
  composerPrompt: "这个周末你想去哪里？", feedTitle: "让周末成为一段故事。", routesTitle: "探索路线",
  tripsTitle: "旅行动态", popularNow: "热门目的地", travelThoughtfully: "安全出行",
  safetyCopy: "使用公共会合地点，出发前确认路况并和同行者商定计划。",
  filterByRoute: "按路线筛选", allRoutes: "所有路线", postYourTrip: "发布你的行程",
  viewRoute: "查看路线", viewTrip: "查看行程", hostedBy: "发起人", startsAt: "出发时间",
  meetingArea: "会合区域", aboutTrip: "行程介绍", joinTrip: "申请加入", manageRequests: "管理申请",
  spots: "个名额", shareTrip: "分享行程链接", discussTrip: "查看行程", requestJoin: "申请加入",
  member: "Qipi 会员", guestHost: "旅行者", tripBoardEmptyTitle: "还没有行程。",
  tripBoardEmptyBody: "有周末计划吗？分享日期和路线，邀请其他人同行。",
  signInToContinue: "请登录后继续。", authIntro: "加入柬埔寨周末旅行社区，浏览路线并结识同行者。",
  authBrand: "柬埔寨旅行社区", authHeadingSignIn: "欢迎回来",
  authHeadingSignUp: "创建你的账号", authHeadingRecover: "找回账号",
  authHeadingReset: "设置新密码",
  authDescriptionSignIn: "登录后分享计划、结识同行者并管理你的行程。",
  authDescriptionSignUp: "创建账号，发布行程、认识旅行者并收藏计划。",
  authDescriptionRecover: "输入邮箱，我们会发送安全的密码重置链接。",
  authDescriptionReset: "设置新密码以重新使用你的 Qipi 账号。",
  authPrivacy: "邮箱仅用于登录，不会显示在行程帖子中。", email: "邮箱", password: "密码",
  displayName: "姓名或昵称", haveAccount: "已有账号？", needAccount: "第一次使用 Qipi？",
  forgotPassword: "忘记密码？", resetPassword: "重置密码", sendReset: "发送重置链接",
  checkEmail: "请查看邮箱并点击确认链接，然后返回 Qipi。", resetSent: "如果该邮箱已注册，重置链接即将发送。",
  passwordUpdated: "密码已更新。", profileTitle: "你的 Qipi 个人资料", savedTrips: "已收藏的行程",
  save: "收藏", unsave: "已收藏", routeFilterEmpty: "没有找到符合条件的路线。",
  createTitle: "发布你的行程", createIntro: "告诉大家你计划去哪里、何时出发。",
  yourName: "姓名或昵称", tripTitle: "行程标题", route: "路线", travelDate: "出行日期",
  departureTime: "出发时间", transport: "交通方式", motorbike: "摩托车", car: "汽车",
  mixed: "混合交通", openPlaces: "开放名额", meetingAreaLabel: "大致会合地点",
  meetingAreaHint: "例如：贡布市中心。请勿填写家庭住址。", costStyle: "费用",
  ownCosts: "各自承担费用", sharedCosts: "分摊油费或团体费用", freeTrip: "无共同费用",
  tripNotes: "行程安排与注意事项", tripNotesHint: "分享行程节奏、停靠点或同行者需要了解的经验。",
  createTripButton: "发布行程", joinTitle: "申请加入", joinIntro: "向发起人介绍自己。",
  travelerName: "姓名或昵称", shortMessage: "简短留言（选填）", sendRequest: "发送申请",
  myTitle: "我的行程和申请", hosting: "我发起的行程", joining: "我提交的申请",
  noHosted: "你还没有发布行程。", noJoined: "你还没有提交加入申请。", open: "打开",
  closed: "已关闭", condition: "路线状况", good: "良好", mixedCondition: "一般",
  caution: "请谨慎出行", routeUpdateNote: "有哪些变化或实用信息？", submitUpdate: "提交审核",
  reportTitle: "举报问题", reason: "原因", inaccurate: "信息不准确", unsafe: "安全问题",
  spam: "垃圾内容", other: "其他", details: "补充说明（选填）", sendReport: "提交举报",
  loading: "加载中…", retry: "重试", copied: "链接已复制", failed: "出错了，请重试。",
  noTripsFilter: "此路线暂无即将出发的行程。", profileSaved: "资料已更新。",
  notifications: "通知", allCaughtUp: "你已查看所有通知", noNotifications: "新动态会显示在这里。",
  feedLoadError: "路线和行程加载失败。请检查网络连接后重试。"
});
Object.assign(copy.en, { searchLabel: "Search", recentSearches: "Recent", editSearches: "Edit", doneEditingSearches: "Done", removeRecentSearch: "Remove recent search", clearSearch: "Clear search", searchRecentEmpty: "Searches you make will appear here.", searchRecentNoMatch: "No recent searches match.", searchResults: "Search results", filters: "Filters", allTrips: "All trips", upcomingOnly: "Upcoming trips only", allTransport: "All transport", noSearchResults: "No trips match these filters.", searchTryAnother: "Try another search or adjust your filters.", searchResultCount: "trips found", savedIntro: "Your bookmarked trips, all in one place.", savedEmptyTitle: "Nothing saved yet", savedEmptyBody: "Bookmark a trip to keep it here." });
Object.assign(copy.km, { searchLabel: "ស្វែងរក", recentSearches: "ស្វែងរកថ្មីៗ", editSearches: "កែសម្រួល", doneEditingSearches: "រួចរាល់", removeRecentSearch: "លុបការស្វែងរក", clearSearch: "សម្អាតការស្វែងរក", searchRecentEmpty: "ការស្វែងរករបស់អ្នកនឹងបង្ហាញនៅទីនេះ។", searchRecentNoMatch: "មិនមានការស្វែងរកថ្មីៗដែលត្រូវគ្នាទេ។", navTrips: "ដំណើរខាងមុខ", searchResults: "លទ្ធផលស្វែងរក", filters: "តម្រង", allTrips: "ដំណើរទាំងអស់", upcomingOnly: "តែដំណើរខាងមុខ", allTransport: "មធ្យោបាយធ្វើដំណើរទាំងអស់", noSearchResults: "មិនមានដំណើរដែលត្រូវនឹងតម្រងទាំងនេះទេ។", searchTryAnother: "សាកស្វែងរកពាក្យផ្សេង ឬ កែតម្រង។", searchResultCount: "ដំណើរដែលរកឃើញ", savedIntro: "ដំណើរដែលអ្នកបានរក្សាទុកនៅកន្លែងតែមួយ។", savedEmptyTitle: "មិនទាន់មានដំណើរដែលបានរក្សាទុកទេ", savedEmptyBody: "ចុចសញ្ញាចំណាំលើដំណើរដើម្បីរក្សាទុកនៅទីនេះ។" });
Object.assign(copy.zh, { searchLabel: "搜索", recentSearches: "最近搜索", editSearches: "编辑", doneEditingSearches: "完成", removeRecentSearch: "删除最近搜索", clearSearch: "清除搜索", searchRecentEmpty: "你的搜索记录会显示在这里。", searchRecentNoMatch: "没有匹配的最近搜索。", navTrips: "即将出发", searchResults: "搜索结果", filters: "筛选", allTrips: "全部行程", upcomingOnly: "仅显示即将出发", allTransport: "全部交通方式", noSearchResults: "没有符合这些筛选条件的行程。", searchTryAnother: "试试其他关键词或调整筛选条件。", searchResultCount: "条行程", savedIntro: "收藏的行程都在这里。", savedEmptyTitle: "还没有收藏行程", savedEmptyBody: "点击行程上的书签，即可将它保存在这里。" });

const auth = new QipiAuth();
const state = {
  lang: ["en", "km", "zh"].includes(localStorage.getItem("qipi:language")) ? localStorage.getItem("qipi:language") : "en",
  routes: [], trips: [], savedTripRecords: [], filter: "", search: "", me: null, view: "feed",
  feedRequestActive: false,
  savedTrips: Array.isArray(readLocal("qipi:saved-trips")) ? readLocal("qipi:saved-trips") : [],
  theme: ["system", "light", "dark"].includes(localStorage.getItem("qipi:theme")) ? localStorage.getItem("qipi:theme") : "system",
  preferences: { defaultTransport: "motorbike", defaultCostStyle: "own", safetyReminders: true, ...readLocal("qipi:preferences") },
  hostKeys: readLocal("qipi:host-keys"), requestKeys: readLocal("qipi:request-keys"),
  recentSearches: Array.isArray(readLocal("qipi:recent-searches")) ? readLocal("qipi:recent-searches") : [], searchEditing: false,
  searchFilters: { upcoming: false, routeId: "", transport: "" }
};
const $ = (selector) => document.querySelector(selector);
const t = (key) => copy[state.lang][key] || copy.en[key] || key;
const label = (value) => value?.[state.lang] || value?.en || "";
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const initials = (value) => String(value || "Q").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
const displayName = () => auth.user?.user_metadata?.display_name?.trim() || auth.user?.email?.split("@")[0] || "";
const dateToday = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Phnom_Penh", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const part = (name) => parts.find((item) => item.type === name).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};
let toastTimeout;

function readLocal(key) {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
}
function saveLocal(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
const ENTRY_CHOICE_KEY = "qipi:entry-choice";
function entryChoice() { try { return sessionStorage.getItem(ENTRY_CHOICE_KEY); } catch { return "guest"; } }
function saveEntryChoice(value) { try { sessionStorage.setItem(ENTRY_CHOICE_KEY, value); } catch {} }
function applyTheme() {
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
  const activeTheme = state.theme === "system" ? (prefersDark ? "dark" : "light") : state.theme;
  document.documentElement.dataset.theme = activeTheme;
  document.documentElement.dataset.themePreference = state.theme;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = activeTheme === "dark" ? "#10191B" : "#F1F7F6";
}
applyTheme();
window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => { if (state.theme === "system") applyTheme(); });
function routeFor(id) { return state.routes.find((route) => route.id === id); }
function dateLabel(date) {
  const locale = state.lang === "km" ? "km-KH" : state.lang === "zh" ? "zh-CN" : "en-GB";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
function dateParts(date) {
  const parsed = new Date(`${date}T00:00:00Z`);
  const locale = state.lang === "km" ? "km-KH" : state.lang === "zh" ? "zh-CN" : "en-GB";
  return {
    day: new Intl.DateTimeFormat(locale, { day: "2-digit", timeZone: "UTC" }).format(parsed),
    month: new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(parsed)
  };
}
function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => element.classList.remove("show"), 3500);
}
async function api(path, { method = "GET", data, headers = {} } = {}) {
  const accessToken = await auth.accessToken();
  const response = await fetch(path, {
    method,
    headers: { ...(data ? { "content-type": "application/json" } : {}), ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}), ...headers },
    body: data ? JSON.stringify(data) : undefined
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || t("failed"));
  return result;
}
function event(type, targetId) { api("/api/events", { method: "POST", data: { type, targetId } }).catch(() => {}); }
function setError(form, message) {
  const box = form.querySelector(".error-message");
  if (box) { box.textContent = message; box.classList.add("show"); }
}
function closeDialogs() {
  document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
}
let openSelectControl = null;
let selectTypeahead = "";
let selectTypeaheadTimer;

function syncEnhancedSelect(select) {
  const shell = select?.closest(".select-control");
  const trigger = shell?.querySelector(".select-trigger");
  if (!trigger) return;
  const option = select.options[select.selectedIndex];
  trigger.querySelector(".select-current").textContent = option?.textContent?.trim() || "—";
  trigger.setAttribute("aria-valuetext", option?.textContent?.trim() || "");
  trigger.disabled = select.disabled;
}

function closeEnhancedSelect(returnFocus = false) {
  if (!openSelectControl) return;
  const { trigger, menu } = openSelectControl;
  trigger.setAttribute("aria-expanded", "false");
  trigger.removeAttribute("aria-activedescendant");
  trigger.removeAttribute("aria-controls");
  menu.remove();
  openSelectControl = null;
  if (returnFocus) trigger.focus();
}

function focusSelectOption(index) {
  if (!openSelectControl) return;
  const options = [...openSelectControl.menu.querySelectorAll("[role='option']")];
  if (!options.length) return;
  const next = (index + options.length) % options.length;
  options[next].focus();
  openSelectControl.trigger.setAttribute("aria-activedescendant", options[next].id);
}

function chooseEnhancedOption(index) {
  if (!openSelectControl) return;
  const { select, trigger } = openSelectControl;
  const option = select.options[index];
  if (!option || option.disabled) return;
  select.value = option.value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  syncEnhancedSelect(select);
  closeEnhancedSelect(true);
}

function openEnhancedSelect(select) {
  if (openSelectControl?.select === select) { closeEnhancedSelect(); return; }
  closeEnhancedSelect();
  const shell = select.closest(".select-control");
  const trigger = shell?.querySelector(".select-trigger");
  if (!trigger || select.disabled) return;
  const menu = document.createElement("div");
  menu.className = "select-options";
  menu.id = `${trigger.id}-options`;
  menu.setAttribute("role", "listbox");
  if (trigger.getAttribute("aria-labelledby")) menu.setAttribute("aria-labelledby", trigger.getAttribute("aria-labelledby"));
  else menu.setAttribute("aria-label", trigger.getAttribute("aria-label") || "Options");
  menu.innerHTML = [...select.options].map((option, index) => `<button type="button" role="option" id="${menu.id}-option-${index}" class="select-option" data-option-index="${index}" aria-selected="${index === select.selectedIndex}" ${option.disabled ? "disabled" : ""}>${esc(option.textContent.trim())}${index === select.selectedIndex ? icon("check", "heroicon select-option-check") : ""}</button>`).join("");
  const host = select.closest("dialog") || document.body;
  host.append(menu);
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(Math.max(rect.width, 190), window.innerWidth - 24);
  const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
  const desiredHeight = Math.min(280, menu.scrollHeight);
  const below = Math.max(0, window.innerHeight - rect.bottom - 12);
  const above = Math.max(0, rect.top - 12);
  const opensBelow = below >= desiredHeight || below >= above;
  const available = opensBelow ? below : above;
  const maxHeight = Math.min(280, Math.max(72, available));
  const visibleHeight = Math.min(desiredHeight, maxHeight);
  const rawTop = opensBelow ? rect.bottom + 6 : rect.top - visibleHeight - 6;
  const top = Math.max(8, Math.min(rawTop, window.innerHeight - visibleHeight - 8));
  Object.assign(menu.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, maxHeight: `${maxHeight}px` });
  trigger.setAttribute("aria-expanded", "true");
  trigger.setAttribute("aria-controls", menu.id);
  openSelectControl = { select, trigger, menu };
  menu.addEventListener("click", (eventTarget) => {
    const option = eventTarget.target.closest("[data-option-index]");
    if (option) chooseEnhancedOption(Number(option.dataset.optionIndex));
  });
  menu.addEventListener("keydown", (eventTarget) => {
    const current = Number(eventTarget.target.closest("[data-option-index]")?.dataset.optionIndex || 0);
    if (eventTarget.key === "ArrowDown") { eventTarget.preventDefault(); focusSelectOption(current + 1); }
    else if (eventTarget.key === "ArrowUp") { eventTarget.preventDefault(); focusSelectOption(current - 1); }
    else if (eventTarget.key === "Home") { eventTarget.preventDefault(); focusSelectOption(0); }
    else if (eventTarget.key === "End") { eventTarget.preventDefault(); focusSelectOption(select.options.length - 1); }
    else if (eventTarget.key === "Enter" || eventTarget.key === " ") { eventTarget.preventDefault(); chooseEnhancedOption(current); }
    else if (eventTarget.key === "Escape") { eventTarget.preventDefault(); closeEnhancedSelect(true); }
    else if (eventTarget.key === "Tab") closeEnhancedSelect();
    else if (eventTarget.key.length === 1 && !eventTarget.ctrlKey && !eventTarget.metaKey) {
      selectTypeahead += eventTarget.key.toLocaleLowerCase();
      clearTimeout(selectTypeaheadTimer);
      selectTypeaheadTimer = setTimeout(() => { selectTypeahead = ""; }, 650);
      const match = [...select.options].findIndex((option) => option.textContent.trim().toLocaleLowerCase().startsWith(selectTypeahead));
      if (match >= 0) { eventTarget.preventDefault(); focusSelectOption(match); }
    }
  });
  menu.querySelector(`[data-option-index="${Math.max(select.selectedIndex, 0)}"]`)?.focus();
}

function enhanceSelects(root = document) {
  const selects = [...(root.matches?.("select") ? [root] : []), ...root.querySelectorAll("select")];
  for (const select of selects) {
    if (select.classList.contains("select-native")) continue;
    const shell = document.createElement("div");
    shell.className = "select-control";
    select.before(shell);
    shell.append(select);
    select.classList.add("select-native");
    select.setAttribute("aria-hidden", "true");
    select.tabIndex = -1;
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "select-trigger";
    trigger.id = `${select.id || "qipi-select"}-trigger`;
    trigger.setAttribute("role", "combobox");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    const labelledBy = select.getAttribute("aria-labelledby");
    const labels = [...(select.labels || [])];
    if (!labelledBy && labels.length) {
      const ids = labels.map((label) => { if (!label.id) label.id = `${select.id}-label`; label.htmlFor = trigger.id; return label.id; });
      trigger.setAttribute("aria-labelledby", ids.join(" "));
    } else if (labelledBy) trigger.setAttribute("aria-labelledby", labelledBy);
    else trigger.setAttribute("aria-label", select.getAttribute("aria-label") || "Choose an option");
    trigger.innerHTML = `<span class="select-current"></span>${icon("chevron-down", "heroicon select-chevron")}`;
    shell.append(trigger);
    trigger.addEventListener("click", () => openEnhancedSelect(select));
    trigger.addEventListener("keydown", (eventTarget) => {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(eventTarget.key)) { eventTarget.preventDefault(); openEnhancedSelect(select); }
    });
    select.addEventListener("change", () => syncEnhancedSelect(select));
    syncEnhancedSelect(select);
  }
}

function syncEnhancedSelects(root = document) {
  const selects = [...(root.matches?.("select") ? [root] : []), ...root.querySelectorAll("select")];
  selects.forEach(syncEnhancedSelect);
}

document.addEventListener("pointerdown", (eventTarget) => {
  if (openSelectControl && !openSelectControl.menu.contains(eventTarget.target) && !openSelectControl.trigger.contains(eventTarget.target)) closeEnhancedSelect();
});
window.addEventListener("resize", () => closeEnhancedSelect());
window.addEventListener("scroll", () => closeEnhancedSelect(), true);

function showDialog(id, html) {
  closeDialogs();
  const dialog = document.getElementById(id);
  dialog.querySelector("[id$='-content']").innerHTML = html;
  enhanceSelects(dialog);
  dialog.showModal();
}
function setLink(param, id) {
  const url = new URL(location.href);
  url.search = "";
  if (param && id) url.searchParams.set(param, id);
  history.replaceState({}, "", url);
}
function applyLanguage() {
  document.documentElement.lang = state.lang === "zh" ? "zh-Hans" : state.lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => { node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel)); });
  if ($("#settings-language")) $("#settings-language").value = state.lang;
  renderAccount(); renderRoutes(); renderFilter(); renderTrips();
  if (state.view === "settings") renderSettings();
  syncEnhancedSelects();
}

function renderAccount() {
  const name = displayName();
  $("#account-label").textContent = name || t("signIn");
  $("#account-avatar").innerHTML = name ? esc(initials(name)) : icon("user");
  $("#rail-avatar").textContent = name ? initials(name) : "Q";
  $("#composer-avatar").textContent = name ? initials(name) : "Q";
  $("#rail-user-name").textContent = name || t("guestTraveler");
}

function setSearch(value) {
  const query = value.trim();
  state.search = query.toLocaleLowerCase();
  if ($("#feed-search")) $("#feed-search").value = query;
  if ($("#mobile-feed-search")) $("#mobile-feed-search").value = query;
  if ($(".search-clear")) $(".search-clear").hidden = !query;
  renderRoutes(); renderTrips();
}

function submitSearch(value) {
  setSearch(value);
  saveRecentSearch(value);
  state.filter = "";
  state.searchFilters = { upcoming: false, routeId: "", transport: "" };
  syncSearchFilterControls();
  closeDesktopSearch();
  closeMobileSearch({ save: false });
  setPageView("search-results");
  renderTrips();
}

function saveRecentSearch(value) {
  const query = value.trim();
  if (!query) return;
  state.recentSearches = [query, ...state.recentSearches.filter((item) => item.toLocaleLowerCase() !== query.toLocaleLowerCase())].slice(0, 8);
  saveLocal("qipi:recent-searches", state.recentSearches);
  renderSearchRecents();
}

function renderSearchRecents() {
  document.querySelectorAll("[data-action='toggle-search-edit']").forEach((button) => { button.textContent = state.searchEditing ? t("doneEditingSearches") : t("editSearches"); });
  const rowMarkup = (query) => `<li class="search-recent-row"><button type="button" class="search-recent-select" data-action="select-recent-search" data-query="${esc(query)}"><span class="search-recent-icon">${icon("clock")}</span><span class="search-recent-text">${esc(query)}</span></button><button type="button" class="search-recent-remove" data-action="remove-recent-search" data-query="${esc(query)}" aria-label="${esc(t("removeRecentSearch"))}: ${esc(query)}"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#close"></use></svg></button></li>`;
  const desktopQuery = $("#feed-search")?.value.trim().toLocaleLowerCase() || "";
  const mobileQuery = $("#mobile-feed-search")?.value.trim().toLocaleLowerCase() || "";
  for (const [id, query] of [["search-recents-list", mobileQuery], ["desktop-search-recents", desktopQuery]]) {
    const list = $(`#${id}`);
    if (!list) continue;
    list.classList.toggle("is-editing", state.searchEditing);
    const recent = state.recentSearches.filter((item) => !query || item.toLocaleLowerCase().includes(query));
    list.innerHTML = recent.length ? `<ul class="search-recent-list">${recent.map(rowMarkup).join("")}</ul>` : `<p class="search-recents-empty">${esc(query ? t("searchRecentNoMatch") : t("searchRecentEmpty"))}</p>`;
  }
}

function openDesktopSearch() {
  const panel = $("#desktop-search-panel");
  if (!panel || window.matchMedia("(max-width: 700px)").matches) return;
  const wasHidden = panel.hidden;
  panel.hidden = false;
  if (wasHidden) { state.searchEditing = false; renderSearchRecents(); }
}

function closeDesktopSearch() {
  const panel = $("#desktop-search-panel");
  if (panel) panel.hidden = true;
}

function openMobileSearch() {
  const dialog = $("#search-dialog");
  if (!dialog?.open) dialog?.showModal();
  state.searchEditing = false;
  renderSearchRecents();
  requestAnimationFrame(() => $("#mobile-feed-search")?.focus());
}

function closeMobileSearch({ save = true } = {}) {
  if (save) saveRecentSearch($("#mobile-feed-search")?.value || "");
  $("#search-dialog")?.close();
}

function renderSettings() {
  const content = $("#settings-account-content");
  if (!content) return;
  const name = displayName();
  content.innerHTML = auth.user
    ? `<div class="settings-profile"><span class="profile-avatar">${esc(initials(name))}</span><div><strong>${esc(name)}</strong><small>${esc(auth.user.email || "")}</small></div></div>
      <form id="settings-profile-form"><div class="field"><label for="settings-profile-name">${esc(t("profileName"))}</label><input id="settings-profile-name" name="displayName" value="${esc(name)}" minlength="2" maxlength="40" required /></div><div class="error-message" role="alert"></div><button class="button button-primary" type="submit">${esc(t("saveProfile"))}</button><button class="settings-signout" type="button" data-action="sign-out">${esc(t("signOut"))}</button></form>`
    : `<p class="settings-guest-copy">${esc(t("guestProfileText"))}</p><button class="button button-primary" type="button" data-action="settings-sign-in">${esc(t("signIn"))}</button>`;
  $("#settings-language").value = state.lang;
  $("#settings-theme").value = state.theme;
  $("#settings-transport").value = state.preferences.defaultTransport;
  $("#settings-cost-style").value = state.preferences.defaultCostStyle;
  $("#settings-safety-reminders").checked = state.preferences.safetyReminders;
  syncEnhancedSelects();
}

function setPageView(view) {
  state.view = view;
  const main = $("#main");
  const settings = $("#settings-view");
  const isSettings = view === "settings";
  const isExplore = view === "explore";
  const isSearchResults = view === "search-results";
  const isSaved = view === "saved";
  main.classList.toggle("settings-open", isSettings || isSaved);
  main.classList.toggle("explore-open", isExplore);
  main.classList.toggle("search-results-open", isSearchResults);
  $("#search-filter-panel").hidden = !isSearchResults;
  $("#saved-view").hidden = !isSaved;
  document.querySelectorAll('.rail-nav a[href="#feed"], .mobile-nav a[href="#feed"]').forEach((item) => item.classList.toggle("active", view === "feed"));
  document.querySelectorAll('.rail-nav a[href="#routes"], .mobile-nav a[href="#routes"]').forEach((item) => item.classList.toggle("active", isExplore));
  document.querySelectorAll('.rail-nav a[href="#trips"], .mobile-nav a[href="#trips"]').forEach((item) => item.classList.toggle("active", view === "trips"));
  document.querySelectorAll('.rail-nav [data-action="open-settings"], .mobile-nav [data-action="open-settings"]').forEach((item) => item.classList.toggle("active", isSettings));
  document.querySelectorAll('.rail-nav [data-action="saved-trips"], .mobile-nav [data-action="saved-trips"]').forEach((item) => item.classList.toggle("active", isSaved));
  document.querySelectorAll(".feed-column > :not(#settings-view):not(#saved-view)").forEach((section) => {
    section.hidden = isSettings || isSaved || (isExplore && section.id !== "routes") || (isSearchResults && section.id !== "trips");
  });
  settings.hidden = !isSettings;
  $("#saved-view").hidden = !isSaved;
  if (isSettings) renderSettings();
  if (isSaved) renderTrips();
  renderRoutes();
  const targetHash = isSettings ? "#settings" : isSaved ? "#saved" : isExplore ? "#routes" : isSearchResults ? "#search" : view === "trips" ? "#trips" : "#feed";
  if (location.hash !== targetHash) history.replaceState(history.state, "", `${location.pathname}${location.search}${targetHash}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setSettingsView(open) { setPageView(open ? "settings" : "feed"); }

function openSettings() {
  closeDialogs();
  setSettingsView(true);
}

async function refreshMe() {
  if (!auth.user) { state.me = null; return; }
  try { state.me = await api("/api/me"); }
  catch { state.me = null; }
}

function renderRoutes() {
  const routeGrid = $("#route-grid");
  const visible = state.routes.filter((route) => !state.search || `${label(route.title)} ${label(route.summary)}`.toLowerCase().includes(state.search));
  const inExplore = state.view === "explore";
  const routeSection = $("#routes");
  routeSection.classList.toggle("explore-mode", inExplore);
  $("#routes-title").textContent = inExplore ? t("exploreRoutes") : t("explore");
  $("#routes .text-link").hidden = inExplore;
  $("#routes .explore-description").hidden = !inExplore;
  routeGrid.setAttribute("aria-busy", "false");
  routeGrid.innerHTML = visible.length ? visible.map((route, index) => inExplore ? `
    <button type="button" class="explore-route-card ${esc(route.accent)}" data-action="open-route" data-id="${esc(route.id)}" aria-label="${esc(t("viewRoute"))}: ${esc(label(route.title))}">
      <span class="explore-route-art"><span class="explore-route-index">0${index + 1}</span><span class="explore-route-mark">${icon("map-pin")}</span><span class="explore-route-kind">${esc(label(route.label))}</span></span>
      <span class="explore-route-copy"><strong>${esc(label(route.title))}</strong><span>${esc(label(route.summary))}</span><small>${icon("clock")} ${esc(label(route.duration))} <span>·</span> ${icon("truck")} ${esc(label(route.mode))}</small><b>${esc(t("viewRoute"))} ${icon("arrow-right")}</b></span>
    </button>` : `
    <button type="button" class="route-story ${esc(route.accent)}" data-action="open-route" data-id="${esc(route.id)}" aria-label="${esc(t("viewRoute"))}: ${esc(label(route.title))}">
      <span class="story-avatar"><span class="story-art"><span class="story-road"></span><span class="story-count">0${index + 1}</span></span></span>
      <span class="story-name">${esc(label(route.title))}</span>
    </button>`).join("") : `<p class="small-copy">${esc(t("routeFilterEmpty"))}</p>`;
}
function renderFilter() {
  $("#trip-route-filter").innerHTML = `<option value="">${esc(t("allRoutes"))}</option>` + state.routes.map((route) => `<option value="${esc(route.id)}">${esc(label(route.title))}</option>`).join("");
  $("#trip-route-filter").value = state.filter;
  syncEnhancedSelect($("#trip-route-filter"));
  const searchRoute = $("#search-route-filter");
  if (searchRoute) {
    searchRoute.innerHTML = `<option value="">${esc(t("allRoutes"))}</option>` + state.routes.map((route) => `<option value="${esc(route.id)}">${esc(label(route.title))}</option>`).join("");
    searchRoute.value = state.searchFilters.routeId;
    syncEnhancedSelect(searchRoute);
  }
  syncSearchFilterControls();
}
function syncSearchFilterControls() {
  const upcoming = $("#search-upcoming-only"), route = $("#search-route-filter"), transport = $("#search-transport-filter");
  if (upcoming) upcoming.checked = state.searchFilters.upcoming;
  if (route) route.value = state.searchFilters.routeId;
  if (transport) transport.value = state.searchFilters.transport;
  if (route) syncEnhancedSelect(route);
  if (transport) syncEnhancedSelect(transport);
  const allButton = $(".search-filter-all");
  const allActive = !state.searchFilters.upcoming && !state.searchFilters.routeId && !state.searchFilters.transport;
  allButton?.classList.toggle("is-active", allActive);
  allButton?.setAttribute("aria-pressed", String(allActive));
}
function renderTrips() {
  const isSaved = state.view === "saved";
  const tripList = $(isSaved ? "#saved-trip-list" : "#trip-list");
  const sourceTrips = isSaved ? state.savedTripRecords : state.trips;
  const filtered = sourceTrips.filter((trip) => isSaved ? state.savedTrips.includes(trip.id) :
    (state.view === "search-results" || !state.filter || trip.routeId === state.filter) &&
    (!state.search || `${trip.title} ${trip.notes} ${trip.hostName} ${label(routeFor(trip.routeId)?.title)}`.toLowerCase().includes(state.search)) &&
    (state.view !== "search-results" || (!state.searchFilters.routeId || trip.routeId === state.searchFilters.routeId) && (!state.searchFilters.transport || trip.transport === state.searchFilters.transport) && (!state.searchFilters.upcoming || trip.date >= dateToday())));
  tripList.setAttribute("aria-busy", "false");
  if (state.view === "search-results") $("#trips-title").textContent = `${t("searchResults")} · ${filtered.length} ${t("searchResultCount")}`;
  else $("#trips-title").textContent = t("forYou");
  if (!filtered.length) {
    tripList.innerHTML = `<div class="empty-trips"><div class="empty-icon">${icon(isSaved ? "bookmark" : state.view === "search-results" ? "search" : "calendar")}</div><h3>${esc(isSaved ? t("savedEmptyTitle") : state.view === "search-results" ? t("noSearchResults") : state.filter ? t("noTripsFilter") : t("tripBoardEmptyTitle"))}</h3><p>${esc(isSaved ? t("savedEmptyBody") : state.view === "search-results" ? t("searchTryAnother") : t("tripBoardEmptyBody"))}</p>${state.view === "search-results" ? `<button class="button button-ghost" type="button" data-action="reset-search-filters">${esc(t("allTrips"))}</button>` : isSaved ? `<button class="button button-primary" type="button" data-action="back-to-feed">${esc(t("home"))}</button>` : `<button class="button button-primary" type="button" data-action="create-trip">${esc(t("postTrip"))} ${icon("arrow-up-right")}</button>`}</div>`;
    return;
  }
  tripList.innerHTML = filtered.map((trip) => {
    const date = dateParts(trip.date);
    const route = routeFor(trip.routeId);
    const saved = state.savedTrips.includes(trip.id);
    const isHost = Boolean(state.hostKeys[trip.id] || state.me?.trips.some((owned) => owned.id === trip.id));
    const request = state.me?.requests.find((item) => item.trip.id === trip.id);
    const isRequested = Boolean(request || state.requestKeys[trip.id]);
    const ctaAction = isHost || isRequested ? "open-trip" : "join-trip";
    const ctaLabel = isHost ? t("manageRequests") : isRequested
      ? t(request?.status === "approved" ? "requestApproved" : request?.status === "declined" ? "requestDeclined" : "requestPending")
      : t("requestJoin");
    const transport = trip.transport === "motorbike" ? t("motorbike") : trip.transport === "car" ? t("car") : t("mixed");
    return `<article class="trip-card">
      <div class="post-head"><span class="post-avatar">${esc(initials(trip.hostName))}</span><div class="post-byline"><strong>${esc(trip.hostName)} ${trip.hostVerified ? `<span class="verified-dot" title="${esc(t("member"))}">${icon("check")}</span>` : ""}</strong><small>${esc(t("guestHost"))} · ${esc(dateLabel(trip.date))}</small></div><button class="post-save ${saved ? "saved" : ""}" type="button" data-action="toggle-save" data-id="${esc(trip.id)}" aria-label="${esc(t(saved ? "unsave" : "save"))}">${icon("bookmark")}</button></div>
      <div class="post-media ${esc(route?.accent || "weekend")}" aria-hidden="true"><span class="post-media-hill"></span><span class="post-media-road"></span><span class="post-media-title">${esc(label(route?.title))}</span></div>
      <h3 class="post-title">${esc(trip.title)}</h3><p class="post-note">${esc((trip.notes || `${label(routeFor(trip.routeId)?.title)} · ${trip.meetingArea}`).slice(0, 170))}</p>
      <div class="post-journey"><span class="post-date"><strong>${date.day}</strong><small>${date.month}</small></span><span class="post-route"><strong>${esc(label(routeFor(trip.routeId)?.title))}</strong><small>${esc(trip.meetingArea)} · ${esc(trip.departureTime)} · ${esc(transport)}</small></span><span class="post-spots">${trip.availableSpots} ${esc(t("spots"))}</span></div>
      <div class="post-actions"><button type="button" data-action="share-trip" data-id="${esc(trip.id)}">${icon("share")} ${esc(t("shareTrip"))}</button><button type="button" data-action="open-trip" data-id="${esc(trip.id)}">${icon("chat")} ${esc(t("discussTrip"))}</button><button type="button" data-action="${ctaAction}" data-id="${esc(trip.id)}">${esc(ctaLabel)} ${icon("arrow-right")}</button></div>
    </article>`;
  }).join("");
}
async function loadTrips() {
  const result = await api("/api/trips");
  state.trips = result.trips;
  renderTrips();
}

function renderFeedLoading() {
  $("#route-grid").setAttribute("aria-busy", "true");
  $("#trip-list").setAttribute("aria-busy", "true");
  $("#route-grid").innerHTML = `<div class="skeleton-routes" aria-hidden="true">${Array.from({ length: 3 }, () => `<span class="skeleton-story"><i></i><b></b></span>`).join("")}</div>`;
  $("#trip-list").innerHTML = `<div class="skeleton-posts" aria-hidden="true">${Array.from({ length: 2 }, () => `<article class="skeleton-post"><span class="skeleton-post-head"><i></i><b></b></span><span class="skeleton-media"></span><span class="skeleton-copy"></span><span class="skeleton-copy short"></span></article>`).join("")}</div>`;
}

function renderFeedError() {
  $("#route-grid").setAttribute("aria-busy", "false");
  $("#route-grid").replaceChildren();
  $("#trip-list").setAttribute("aria-busy", "false");
  $("#trip-list").innerHTML = `<div class="feed-load-error" role="alert"><p>${esc(t("feedLoadError"))}</p><button class="button button-ghost" type="button" data-action="retry-feed">${esc(t("retry"))}</button></div>`;
}

async function loadFeedData() {
  if (state.feedRequestActive) return;
  state.feedRequestActive = true;
  if ($("#route-grid").getAttribute("aria-busy") !== "true") renderFeedLoading();
  try {
    const [routeResult, tripResult] = await Promise.all([api("/api/routes"), api("/api/trips")]);
    state.routes = routeResult.routes;
    state.trips = tripResult.trips;
    applyLanguage();
  } catch (error) {
    renderFeedError();
    toast(error.message || t("failed"));
  } finally {
    state.feedRequestActive = false;
  }
}

async function openRoute(id, deepLink = true) {
  try {
    const { route, updates } = await api(`/api/routes/${encodeURIComponent(id)}`);
    if (deepLink) setLink("route", id);
    event("route_viewed", id);
    showDialog("route-dialog", `
      <p class="dialog-kicker">${esc(t("routeGuide"))} / ${esc(label(route.label))}</p><h2 id="route-dialog-title">${esc(label(route.title))}</h2><p class="dialog-intro">${esc(label(route.summary))}</p>
      <div class="detail-facts"><span class="fact-pill">${icon("clock")} ${esc(label(route.duration))}</span><span class="fact-pill">${icon("truck")} ${esc(label(route.mode))}</span><span class="fact-pill">${icon("sparkles")} ${esc(label(route.level))}</span></div>
      <div class="dialog-section"><h3>${esc(t("routeStops"))}</h3><ol class="stop-list">${route.stops.map((stop) => `<li>${esc(label(stop))}</li>`).join("")}</ol></div>
      <div class="dialog-section"><h3>${esc(t("costChecklist"))}</h3><ul class="stop-list">${route.costChecklist.map((cost) => `<li>${esc(label(cost))}</li>`).join("")}</ul></div>
      <div class="note-box"><strong>${esc(t("routeNote"))}</strong>${esc(label(route.note))}</div>
      <p class="source-line">${esc(t("reviewed"))}: ${esc(dateLabel(route.reviewedAt))} · <a href="${esc(route.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(t("routeSource"))} ${icon("arrow-up-right")}</a></p>
      <div class="dialog-actions"><a class="button button-ghost" href="${esc(route.mapUrl)}" target="_blank" rel="noopener noreferrer">${esc(t("openMap"))} ${icon("arrow-up-right")}</a><button class="button button-primary" type="button" data-action="show-route-trips" data-id="${esc(id)}">${esc(t("findTripsHere"))} ${icon("arrow-right")}</button></div>
      <div class="dialog-section"><h3>${esc(t("recentNotes"))}</h3><div class="updates-list">${updates.length ? updates.map((update) => `<div class="update-item"><strong>${esc(update.nickname)}</strong><small>${esc(dateLabel(update.visitedOn))} · ${esc(t(update.condition === "mixed" ? "mixedCondition" : update.condition))}</small><p>${esc(update.note)}</p></div>`).join("") : `<p class="small-copy">${esc(t("noNotes"))}</p>`}</div><div class="dialog-actions"><button class="plain-button" type="button" data-action="open-update" data-id="${esc(id)}">${esc(t("addRouteNote"))} ${icon("arrow-up-right")}</button><button class="plain-button danger-link" type="button" data-action="open-report" data-type="route" data-id="${esc(id)}">${esc(t("reportRoute"))}</button></div></div>
      <p class="small-copy">${esc(t("routeNotLive"))}</p>`);
  } catch (error) { toast(error.message || t("failed")); }
}

async function openTrip(id, deepLink = true) {
  try {
    const { trip } = await api(`/api/trips/${encodeURIComponent(id)}`);
    if (deepLink) setLink("trip", id);
    event("trip_viewed", id);
    let requestStatus = state.me?.requests.find((request) => request.trip.id === id)?.status || "";
    const ownRequest = state.requestKeys[id];
    if (!requestStatus && ownRequest) {
      try {
        const result = await api(`/api/trips/${encodeURIComponent(id)}/requests/${encodeURIComponent(ownRequest.id)}`, { headers: { "x-request-token": ownRequest.token } });
        requestStatus = result.request.status;
      } catch { requestStatus = ""; }
    }
    const isHost = Boolean(state.hostKeys[id] || state.me?.trips.some((owned) => owned.id === id));
    const statusText = requestStatus ? t(requestStatus === "approved" ? "requestApproved" : requestStatus === "declined" ? "requestDeclined" : "requestPending") : "";
    const primary = isHost
      ? `<button class="button button-primary" type="button" data-action="manage-trip" data-id="${esc(id)}">${esc(t("manageRequests"))} ${icon("arrow-up-right")}</button>`
      : requestStatus
        ? `<span class="status-chip ${esc(requestStatus)}">${esc(statusText)}</span>`
        : trip.status === "closed"
          ? `<span class="status-chip closed">${esc(t("closedTrip"))}</span>`
          : trip.availableSpots === 0
            ? `<span class="status-chip closed">${esc(t("fullTrip"))}</span>`
            : `<button class="button button-primary" type="button" data-action="join-trip" data-id="${esc(id)}">${esc(t("joinTrip"))} ${icon("arrow-up-right")}</button>`;
    showDialog("trip-dialog", `
      <p class="dialog-kicker">${esc(label(routeFor(trip.routeId)?.title))} / ${esc(dateLabel(trip.date))}</p><h2 id="trip-dialog-title">${esc(trip.title)}</h2><p class="dialog-intro">${esc(t("hostedBy"))} ${esc(trip.hostName)} · ${esc(trip.availableSpots)} ${esc(t("spots"))}</p>
      <div class="detail-facts"><span class="fact-pill">${icon("clock")} ${esc(trip.departureTime)}</span><span class="fact-pill">${icon("truck")} ${esc(trip.transport === "motorbike" ? t("motorbike") : trip.transport === "car" ? t("car") : t("mixed"))}</span><span class="fact-pill">${icon("users")} ${esc(trip.costStyle === "shared" ? t("sharedCosts") : trip.costStyle === "free" ? t("freeTrip") : t("ownCosts"))}</span></div>
      <div class="dialog-section"><h3>${esc(t("meetingArea"))}</h3><p class="dialog-intro">${esc(trip.meetingArea)}</p></div>
      <div class="dialog-section"><h3>${esc(t("aboutTrip"))}</h3><p class="dialog-intro">${esc(trip.notes || "—")}</p></div>
      <div class="note-box">${esc(t("noContact"))}</div>
      <div class="dialog-actions">${primary}<button class="button button-ghost" type="button" data-action="share-trip" data-id="${esc(id)}">${esc(t("shareTrip"))} ${icon("arrow-up-right")}</button></div>
      <div id="requests-panel"></div>
      <div class="dialog-section"><div class="dialog-actions">${isHost && trip.status === "open" ? `<button class="plain-button" type="button" data-action="close-trip" data-id="${esc(id)}">${esc(t("closeTrip"))}</button>` : ""}<button class="plain-button danger-link" type="button" data-action="open-report" data-type="trip" data-id="${esc(id)}">${esc(t("reportTrip"))}</button></div></div>`);
  } catch (error) { toast(error.message || t("failed")); }
}

function openCreate(selectedRoute = "") {
  showDialog("create-dialog", `
    <p class="dialog-kicker">QIPI / ${esc(t("postTrip"))}</p><h2 id="create-dialog-title">${esc(t("createTitle"))}</h2><p class="dialog-intro">${esc(t("createIntro"))}</p>
    <form id="create-form"><div class="form-grid">
      <div class="field"><label for="host-name">${esc(t("yourName"))}</label><input id="host-name" name="hostName" maxlength="40" minlength="2" required value="${esc(displayName() || localStorage.getItem("qipi:nickname") || "")}" /></div>
      <div class="field"><label for="trip-title">${esc(t("tripTitle"))}</label><input id="trip-title" name="title" maxlength="80" minlength="5" required /></div>
      <div class="field span-2"><label for="trip-route">${esc(t("route"))}</label><select id="trip-route" name="routeId" required><option value="">—</option>${state.routes.map((route) => `<option value="${esc(route.id)}" ${route.id === selectedRoute ? "selected" : ""}>${esc(label(route.title))}</option>`).join("")}</select></div>
      <div class="field"><label for="trip-date">${esc(t("travelDate"))}</label><input id="trip-date" name="date" type="date" min="${dateToday()}" required /></div>
      <div class="field"><label for="trip-time">${esc(t("departureTime"))}</label><input id="trip-time" name="departureTime" type="time" value="07:00" required /></div>
      <div class="field"><label for="trip-transport">${esc(t("transport"))}</label><select id="trip-transport" name="transport"><option value="motorbike" ${state.preferences.defaultTransport === "motorbike" ? "selected" : ""}>${esc(t("motorbike"))}</option><option value="car" ${state.preferences.defaultTransport === "car" ? "selected" : ""}>${esc(t("car"))}</option><option value="mixed" ${state.preferences.defaultTransport === "mixed" ? "selected" : ""}>${esc(t("mixed"))}</option></select></div>
      <div class="field"><label for="trip-seats">${esc(t("openPlaces"))}</label><input id="trip-seats" name="seats" type="number" min="1" max="12" value="3" required /></div>
      <div class="field span-2"><label for="trip-meeting">${esc(t("meetingAreaLabel"))}</label><input id="trip-meeting" name="meetingArea" minlength="3" maxlength="80" required /><small>${esc(t("meetingAreaHint"))}</small></div>
      <div class="field span-2"><label for="trip-cost">${esc(t("costStyle"))}</label><select id="trip-cost" name="costStyle"><option value="own" ${state.preferences.defaultCostStyle === "own" ? "selected" : ""}>${esc(t("ownCosts"))}</option><option value="shared" ${state.preferences.defaultCostStyle === "shared" ? "selected" : ""}>${esc(t("sharedCosts"))}</option><option value="free" ${state.preferences.defaultCostStyle === "free" ? "selected" : ""}>${esc(t("freeTrip"))}</option></select></div>
      <div class="field span-2"><label for="trip-notes">${esc(t("tripNotes"))}</label><textarea id="trip-notes" name="notes" maxlength="500" placeholder="${esc(t("tripNotesHint"))}"></textarea></div>
    </div>${state.preferences.safetyReminders ? `<div class="note-box settings-safety-note">${esc(t("safetyReminder"))}</div>` : ""}<div class="error-message" role="alert"></div><button class="button button-primary form-submit" type="submit">${esc(t("createTripButton"))} ${icon("arrow-up-right")}</button><p class="small-copy">${esc(t("hostDeviceNote"))}</p></form>`);
}
function openJoin(id) {
  showDialog("join-dialog", `<p class="dialog-kicker">QIPI / ${esc(t("joinTrip"))}</p><h2 id="join-dialog-title">${esc(t("joinTitle"))}</h2><p class="dialog-intro">${esc(t("joinIntro"))}</p><form id="join-form" data-trip-id="${esc(id)}"><div class="field"><label for="join-name">${esc(t("travelerName"))}</label><input id="join-name" name="travelerName" minlength="2" maxlength="40" required value="${esc(displayName() || localStorage.getItem("qipi:nickname") || "")}" /></div><div class="field"><label for="join-message">${esc(t("shortMessage"))}</label><textarea id="join-message" name="message" maxlength="280"></textarea></div><div class="error-message" role="alert"></div><button class="button button-primary form-submit" type="submit">${esc(t("sendRequest"))} ${icon("arrow-up-right")}</button></form>`);
}
async function manageTrip(id) {
  try {
    const result = await api(`/api/trips/${encodeURIComponent(id)}/requests`, { headers: { "x-host-token": state.hostKeys[id] || "" } });
    const panel = $("#requests-panel");
    if (!panel) return;
    panel.innerHTML = `<div class="dialog-section"><h3>${esc(t("requestList"))}</h3>${result.requests.length ? result.requests.map((request) => `<div class="request-row"><strong>${esc(request.travelerName)}</strong> <span class="status-chip ${esc(request.status)}">${esc(request.status)}</span><p>${esc(request.message || "—")}</p>${request.status === "pending" ? `<div class="dialog-actions"><button class="button button-primary" type="button" data-action="decide-request" data-id="${esc(id)}" data-request="${esc(request.id)}" data-decision="approved">${esc(t("approve"))}</button><button class="button button-ghost" type="button" data-action="decide-request" data-id="${esc(id)}" data-request="${esc(request.id)}" data-decision="declined">${esc(t("decline"))}</button></div>` : ""}</div>`).join("") : `<p class="small-copy">${esc(t("noRequests"))}</p>`}</div>`;
  } catch (error) { toast(error.message || t("failed")); }
}

async function openMyTrips() {
  try {
    if (auth.enabled && !auth.user) { openAuth("signin"); return; }
    if (auth.user) await refreshMe();
    const { trips } = await api("/api/trips?includeClosed=true");
    const hosted = [...(state.me?.trips || []), ...trips.filter((trip) => state.hostKeys[trip.id])]
      .filter((trip, index, all) => all.findIndex((item) => item.id === trip.id) === index);
    const legacyRequests = await Promise.all(Object.entries(state.requestKeys).map(async ([tripId, request]) => {
      try {
        const [tripResult, requestResult] = await Promise.all([
          api(`/api/trips/${encodeURIComponent(tripId)}`),
          api(`/api/trips/${encodeURIComponent(tripId)}/requests/${encodeURIComponent(request.id)}`, { headers: { "x-request-token": request.token } })
        ]);
        return { trip: tripResult.trip, status: requestResult.request.status };
      } catch { return null; }
    }));
    const requests = [...(state.me?.requests || []).map(({ trip, status }) => ({ trip, status })), ...legacyRequests.filter(Boolean)]
      .filter((item, index, all) => all.findIndex((entry) => entry.trip.id === item.trip.id) === index);
    showDialog("my-dialog", `<p class="dialog-kicker">QIPI / ${esc(t("myTrips"))}</p><h2 id="my-dialog-title">${esc(t("myTitle"))}</h2><p class="dialog-intro">${esc(t("myIntro"))}</p>
      <div class="dialog-section"><h3>${esc(t("hosting"))}</h3><div class="my-list">${hosted.length ? hosted.map((trip) => `<div class="my-card"><div><strong>${esc(trip.title)}</strong><p>${esc(dateLabel(trip.date))} · ${esc(t(trip.status))}</p></div><button type="button" data-action="open-trip" data-id="${esc(trip.id)}">${esc(t("open"))} ${icon("arrow-up-right")}</button></div>`).join("") : `<p class="small-copy">${esc(t("noHosted"))}</p>`}</div></div>
      <div class="dialog-section"><h3>${esc(t("joining"))}</h3><div class="my-list">${requests.length ? requests.map(({ trip, status }) => `<div class="my-card"><div><strong>${esc(trip.title)}</strong><p>${esc(dateLabel(trip.date))} · ${esc(status === "approved" ? t("requestApproved") : status === "declined" ? t("requestDeclined") : t("requestPending"))}</p></div><button type="button" data-action="open-trip" data-id="${esc(trip.id)}">${esc(t("open"))} ${icon("arrow-up-right")}</button></div>`).join("") : `<p class="small-copy">${esc(t("noJoined"))}</p>`}</div></div>`);
  } catch (error) { toast(error.message || t("failed")); }
}

async function openSavedTrips() {
  try {
    const { trips } = await api("/api/trips?includeClosed=true");
    state.savedTripRecords = trips.filter((trip) => state.savedTrips.includes(trip.id));
    setPageView("saved");
  } catch (error) { toast(error.message || t("failed")); }
}

function openUpdate(id) {
  showDialog("update-dialog", `<p class="dialog-kicker">QIPI / ${esc(t("addRouteNote"))}</p><h2 id="update-dialog-title">${esc(t("updateTitle"))}</h2><p class="dialog-intro">${esc(t("updateIntro"))}</p><form id="update-form" data-route-id="${esc(id)}"><div class="form-grid"><div class="field"><label for="update-name">${esc(t("yourName"))}</label><input id="update-name" name="nickname" minlength="2" maxlength="40" required value="${esc(displayName() || localStorage.getItem("qipi:nickname") || "")}" /></div><div class="field"><label for="update-date">${esc(t("visitDate"))}</label><input id="update-date" type="date" name="visitedOn" max="${dateToday()}" required /></div><div class="field span-2"><label for="update-condition">${esc(t("condition"))}</label><select id="update-condition" name="condition"><option value="good">${esc(t("good"))}</option><option value="mixed">${esc(t("mixedCondition"))}</option><option value="caution">${esc(t("caution"))}</option></select></div><div class="field span-2"><label for="update-note">${esc(t("routeUpdateNote"))}</label><textarea id="update-note" name="note" minlength="10" maxlength="500" required></textarea></div></div><div class="error-message" role="alert"></div><button class="button button-primary form-submit" type="submit">${esc(t("submitUpdate"))} ${icon("arrow-up-right")}</button></form>`);
}
function openReport(type, id) {
  showDialog("report-dialog", `<p class="dialog-kicker">QIPI / ${esc(t("reportTitle"))}</p><h2 id="report-dialog-title">${esc(t("reportTitle"))}</h2><p class="dialog-intro">${esc(t("reportIntro"))}</p><form id="report-form" data-target-type="${esc(type)}" data-target-id="${esc(id)}"><div class="field"><label for="report-reason">${esc(t("reason"))}</label><select id="report-reason" name="reason"><option value="inaccurate">${esc(t("inaccurate"))}</option><option value="unsafe">${esc(t("unsafe"))}</option><option value="spam">${esc(t("spam"))}</option><option value="other">${esc(t("other"))}</option></select></div><div class="field"><label for="report-details">${esc(t("details"))}</label><textarea id="report-details" name="details" maxlength="500"></textarea></div><div class="error-message" role="alert"></div><button class="button button-primary form-submit" type="submit">${esc(t("sendReport"))} ${icon("arrow-up-right")}</button></form>`);
}
async function shareTrip(id) {
  const url = new URL(location.origin + "/");
  url.searchParams.set("trip", id);
  try { await navigator.clipboard.writeText(url.toString()); toast(t("copied")); }
  catch { window.prompt(t("shareTrip"), url.toString()); }
}

let pendingAction = null;
function requireSignIn(action) {
  if (!auth.enabled || auth.user) { action(); return; }
  pendingAction = action;
  openAuth("signin");
}

function openAuth(mode = "signin") {
  if (!auth.enabled) {
    showDialog("auth-dialog", `<p class="dialog-kicker">QIPI / ${esc(t("profile"))}</p><h2 id="auth-dialog-title">${esc(t("profile"))}</h2><p class="dialog-intro">${esc(t("authUnavailable"))}</p>`);
    return;
  }
  if (mode === "profile" && auth.user) {
    const name = displayName();
    showDialog("auth-dialog", `<p class="dialog-kicker">QIPI / ${esc(t("profile"))}</p><h2 id="auth-dialog-title">${esc(t("profileTitle"))}</h2><div class="profile-summary"><span class="profile-avatar">${esc(initials(name))}</span><div><strong>${esc(name)}</strong><small>${esc(auth.user.email || "")}</small></div></div><div class="dialog-actions"><button class="button button-primary" type="button" data-action="my-trips">${esc(t("myTrips"))}</button><button class="button button-ghost" type="button" data-action="sign-out">${esc(t("signOut"))}</button></div>`);
    return;
  }
  const signup = mode === "signup";
  const recover = mode === "recover";
  const reset = mode === "reset";
  const title = t(signup ? "authHeadingSignUp" : recover ? "authHeadingRecover" : reset ? "authHeadingReset" : "authHeadingSignIn");
  const description = t(signup ? "authDescriptionSignUp" : recover ? "authDescriptionRecover" : reset ? "authDescriptionReset" : "authDescriptionSignIn");
  const passwordField = (showRecoveryLink = false, autocomplete = "current-password") => `
    <div class="field">
      <div class="field-label-row"><label for="auth-password">${esc(t("password"))}</label>${showRecoveryLink ? `<button class="auth-forgot" type="button" data-action="auth-mode" data-mode="recover">${esc(t("forgotPassword"))}</button>` : ""}</div>
      <input id="auth-password" name="password" type="password" minlength="8" autocomplete="${autocomplete}" required />
    </div>`;
  const submitLabel = signup ? t("signUp") : recover ? t("sendReset") : reset ? t("resetPassword") : t("signIn");
  const form = reset
    ? `<form class="auth-form" id="auth-form" data-mode="reset">${passwordField(false, "new-password")}<div class="error-message" role="alert"></div><button class="button button-primary form-submit" type="submit">${esc(submitLabel)}</button></form>`
    : `<form class="auth-form" id="auth-form" data-mode="${esc(mode)}">${signup ? `<div class="field"><label for="auth-name">${esc(t("displayName"))}</label><input id="auth-name" name="displayName" minlength="2" maxlength="40" autocomplete="name" required /></div>` : ""}<div class="field"><label for="auth-email">${esc(t("email"))}</label><input id="auth-email" name="email" type="email" autocomplete="email" required /></div>${recover ? "" : passwordField(!signup, signup ? "new-password" : "current-password")}<div class="error-message" role="alert"></div><button class="button button-primary form-submit" type="submit">${esc(submitLabel)} ${icon("arrow-up-right")}</button></form>`;
  showDialog("auth-dialog", `<div class="auth-brand-lockup"><span class="brand-mark" aria-hidden="true"><span></span><span></span></span><span class="auth-brand-name">Qipi</span><span class="auth-brand-tag">${esc(t("authBrand"))}</span></div><h2 id="auth-dialog-title">${esc(title)}</h2><p class="dialog-intro auth-intro">${esc(description)}</p>${form}<div class="auth-privacy">${icon("shield-check")}<span>${esc(t("authPrivacy"))}</span></div>${!reset ? `<div class="auth-switch"><span>${esc(signup ? t("haveAccount") : t("needAccount"))}</span><button type="button" data-action="auth-mode" data-mode="${signup ? "signin" : "signup"}">${esc(signup ? t("signIn") : t("signUp"))}</button></div>` : ""}`);
}

async function authSuccess() {
  await refreshMe();
  renderAccount();
  renderSettings();
  renderTrips();
  closeDialogs();
  const action = pendingAction;
  pendingAction = null;
  if (action) action();
}

document.addEventListener("click", async (eventTarget) => {
  const button = eventTarget.target.closest("[data-action]");
  if (!button) return;
  const { action, id, type, request, decision, mode } = button.dataset;
  if (action === "open-mobile-search") { openMobileSearch(); return; }
  if (action === "close-mobile-search") { closeMobileSearch(); return; }
  if (action === "clear-mobile-search") { $("#mobile-feed-search").value = ""; renderSearchRecents(); $("#mobile-feed-search")?.focus(); return; }
  if (action === "toggle-search-edit") { state.searchEditing = !state.searchEditing; renderSearchRecents(); return; }
  if (action === "select-recent-search") { submitSearch(button.dataset.query || ""); return; }
  if (action === "remove-recent-search") { state.recentSearches = state.recentSearches.filter((item) => item !== button.dataset.query); saveLocal("qipi:recent-searches", state.recentSearches); renderSearchRecents(); return; }
  if (action === "reset-search-filters") { state.searchFilters = { upcoming: false, routeId: "", transport: "" }; syncSearchFilterControls(); renderTrips(); return; }
  if (action === "toggle-notifications") {
    const panel = $("#notifications-panel");
    panel.hidden = !panel.hidden;
    button.setAttribute("aria-expanded", String(!panel.hidden));
    return;
  }
  if (action === "close-notifications") {
    $("#notifications-panel").hidden = true;
    $("[data-action='toggle-notifications']").setAttribute("aria-expanded", "false");
    return;
  }
  if (action === "entry-guest") { saveEntryChoice("guest"); $("#entry-dialog").close(); return; }
  if (action === "entry-account") { saveEntryChoice("account"); $("#entry-dialog").close(); openAuth(auth.user ? "profile" : "signin"); return; }
  if (action === "retry-feed") { await loadFeedData(); return; }
  if (action === "close-dialog") { closeDialogs(); setLink(); }
  if (action === "open-route") openRoute(id);
  if (action === "open-trip") openTrip(id);
  if (action === "create-trip") requireSignIn(() => openCreate(id || state.filter));
  if (action === "join-trip") requireSignIn(() => openJoin(id));
  if (action === "my-trips") openMyTrips();
  if (action === "saved-trips") openSavedTrips();
  if (action === "open-settings") openSettings();
  if (action === "back-to-feed") setSettingsView(false);
  if (action === "settings-sign-in") openAuth("signin");
  if (action === "account") { pendingAction = null; openAuth(auth.user ? "profile" : "signin"); }
  if (action === "auth-mode") openAuth(mode);
  if (action === "sign-out") { await auth.signOut(); state.me = null; renderAccount(); renderSettings(); renderTrips(); closeDialogs(); }
  if (action === "toggle-save") {
    state.savedTrips = state.savedTrips.includes(id) ? state.savedTrips.filter((item) => item !== id) : [...state.savedTrips, id];
    saveLocal("qipi:saved-trips", state.savedTrips);
    renderTrips();
  }
  if (action === "manage-trip") manageTrip(id);
  if (action === "open-update") requireSignIn(() => openUpdate(id));
  if (action === "open-report") openReport(type, id);
  if (action === "share-trip") shareTrip(id);
  if (action === "show-route-trips") {
    state.filter = id; renderFilter(); renderTrips(); closeDialogs(); setLink(); $("#trips").scrollIntoView({ behavior: "smooth" });
  }
  if (action === "decide-request") {
    try {
      await api(`/api/trips/${encodeURIComponent(id)}/requests/${encodeURIComponent(request)}/decision`, {
        method: "POST", data: { decision }, headers: { "x-host-token": state.hostKeys[id] || "" }
      });
      toast(t("decisionSuccess")); await manageTrip(id); await loadTrips();
    } catch (error) { toast(error.message || t("failed")); }
  }
  if (action === "close-trip") {
    if (!window.confirm(t("confirmClose"))) return;
    try {
      await api(`/api/trips/${encodeURIComponent(id)}/close`, { method: "POST", data: {}, headers: { "x-host-token": state.hostKeys[id] || "" } });
      toast(t("tripClosed")); await refreshMe(); await loadTrips(); await openTrip(id);
    } catch (error) { toast(error.message || t("failed")); }
  }
});

document.addEventListener("click", (eventTarget) => {
  if (eventTarget.target.closest(".notification-wrap")) return;
  const panel = $("#notifications-panel");
  if (!panel.hidden) {
    panel.hidden = true;
    $("[data-action='toggle-notifications']").setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", (eventTarget) => {
  if (eventTarget.key !== "Escape") return;
  const panel = $("#notifications-panel");
  if (!panel.hidden) {
    panel.hidden = true;
    $("[data-action='toggle-notifications']").setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("submit", async (eventTarget) => {
  const form = eventTarget.target;
  if (form.id === "settings-profile-form") {
    eventTarget.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(form));
      await auth.updateProfile(values.displayName.trim());
      renderAccount(); renderSettings(); toast(t("profileSaved"));
    } catch (error) { setError(form, error.message || t("profileSaveError")); }
    finally { submit.disabled = false; }
    return;
  }
  if (form.id === "auth-form") {
    eventTarget.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    const values = Object.fromEntries(new FormData(form));
    try {
      if (form.dataset.mode === "signup") {
        const signedIn = await auth.signUp(values);
        if (signedIn) await authSuccess();
        else form.insertAdjacentHTML("beforeend", `<p class="auth-status">${esc(t("checkEmail"))}</p>`);
      } else if (form.dataset.mode === "signin") {
        await auth.signIn(values);
        await authSuccess();
      } else if (form.dataset.mode === "recover") {
        await auth.recover(values.email);
        form.insertAdjacentHTML("beforeend", `<p class="auth-status">${esc(t("resetSent"))}</p>`);
      } else if (form.dataset.mode === "reset") {
        await auth.updatePassword(values.password);
        toast(t("passwordUpdated"));
        await authSuccess();
      }
    } catch (error) { setError(form, error.message || t("failed")); }
    finally { submit.disabled = false; }
    return;
  }
  if (!["create-form", "join-form", "update-form", "report-form"].includes(form.id)) return;
  eventTarget.preventDefault();
  const submit = form.querySelector("button[type=submit]");
  submit.disabled = true;
  const values = Object.fromEntries(new FormData(form));
  try {
    if (form.id === "create-form") {
      const { trip, ownerToken } = await api("/api/trips", { method: "POST", data: values });
      if (ownerToken) { state.hostKeys[trip.id] = ownerToken; saveLocal("qipi:host-keys", state.hostKeys); }
      localStorage.setItem("qipi:nickname", values.hostName);
      toast(t("saveSuccess")); await refreshMe(); await loadTrips(); await openTrip(trip.id);
    }
    if (form.id === "join-form") {
      const id = form.dataset.tripId;
      const { request, requestToken } = await api(`/api/trips/${encodeURIComponent(id)}/requests`, { method: "POST", data: values });
      if (requestToken) { state.requestKeys[id] = { id: request.id, token: requestToken }; saveLocal("qipi:request-keys", state.requestKeys); }
      localStorage.setItem("qipi:nickname", values.travelerName);
      toast(t("requestSuccess")); await refreshMe(); renderTrips(); await openTrip(id);
    }
    if (form.id === "update-form") {
      await api(`/api/routes/${encodeURIComponent(form.dataset.routeId)}/updates`, { method: "POST", data: values });
      localStorage.setItem("qipi:nickname", values.nickname);
      closeDialogs(); toast(t("updateSuccess"));
    }
    if (form.id === "report-form") {
      await api("/api/reports", { method: "POST", data: { ...values, targetType: form.dataset.targetType, targetId: form.dataset.targetId } });
      closeDialogs(); toast(t("reportSuccess"));
    }
  } catch (error) { setError(form, error.message || t("failed")); }
  finally { submit.disabled = false; }
});

enhanceSelects();
$("#trip-route-filter").addEventListener("change", (eventTarget) => { state.filter = eventTarget.target.value; renderTrips(); });
$("#feed-search").addEventListener("focus", openDesktopSearch);
$("#feed-search").addEventListener("input", renderSearchRecents);
$("#feed-search").addEventListener("keydown", (eventTarget) => { if (eventTarget.key === "Enter") { eventTarget.preventDefault(); submitSearch(eventTarget.target.value); eventTarget.target.blur(); } });
$("#mobile-feed-search").addEventListener("input", renderSearchRecents);
$("#mobile-feed-search").addEventListener("keydown", (eventTarget) => { if (eventTarget.key === "Enter") { eventTarget.preventDefault(); submitSearch(eventTarget.target.value); eventTarget.target.blur(); } });
document.addEventListener("click", (eventTarget) => { if (!$("#desktop-search-wrap")?.contains(eventTarget.target)) closeDesktopSearch(); });
document.addEventListener("keydown", (eventTarget) => { if (eventTarget.key === "Escape" && !$("#desktop-search-panel").hidden) { closeDesktopSearch(); $("#feed-search").blur(); } });
$("#search-upcoming-only").addEventListener("change", (eventTarget) => { state.searchFilters.upcoming = eventTarget.target.checked; syncSearchFilterControls(); renderTrips(); });
$("#search-route-filter").addEventListener("change", (eventTarget) => { state.searchFilters.routeId = eventTarget.target.value; syncSearchFilterControls(); renderTrips(); });
$("#search-transport-filter").addEventListener("change", (eventTarget) => { state.searchFilters.transport = eventTarget.target.value; syncSearchFilterControls(); renderTrips(); });
$("#settings-language").addEventListener("change", (eventTarget) => {
  state.lang = ["en", "km", "zh"].includes(eventTarget.target.value) ? eventTarget.target.value : "en";
  localStorage.setItem("qipi:language", state.lang);
  applyLanguage();
});
$("#settings-theme").addEventListener("change", (eventTarget) => {
  state.theme = ["system", "light", "dark"].includes(eventTarget.target.value) ? eventTarget.target.value : "system";
  localStorage.setItem("qipi:theme", state.theme); applyTheme();
});
$("#settings-transport").addEventListener("change", (eventTarget) => {
  state.preferences.defaultTransport = ["motorbike", "car", "mixed"].includes(eventTarget.target.value) ? eventTarget.target.value : "motorbike";
  saveLocal("qipi:preferences", state.preferences);
});
$("#settings-cost-style").addEventListener("change", (eventTarget) => {
  state.preferences.defaultCostStyle = ["own", "shared", "free"].includes(eventTarget.target.value) ? eventTarget.target.value : "own";
  saveLocal("qipi:preferences", state.preferences);
});
$("#settings-safety-reminders").addEventListener("change", (eventTarget) => {
  state.preferences.safetyReminders = eventTarget.target.checked;
  saveLocal("qipi:preferences", state.preferences);
});
document.querySelectorAll("a[href^='#']").forEach((anchor) => anchor.addEventListener("click", (eventTarget) => {
  const target = anchor.getAttribute("href");
  if (target === "#routes") { eventTarget.preventDefault(); setPageView("explore"); }
  else if (target === "#feed") { eventTarget.preventDefault(); setPageView("feed"); }
  else if (target === "#trips") {
    eventTarget.preventDefault();
    setPageView("trips");
    requestAnimationFrame(() => $("#trips").scrollIntoView({ behavior: "smooth", block: "start" }));
  }
}));
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (eventTarget) => {
    if (eventTarget.target === dialog && dialog.id !== "entry-dialog") {
      if (dialog.id === "search-dialog") closeMobileSearch();
      else { dialog.close(); setLink(); }
    }
  });
  if (dialog.id === "entry-dialog") dialog.addEventListener("cancel", (eventTarget) => eventTarget.preventDefault());
});

async function initialize() {
  renderFeedLoading();
  try {
    await auth.initialize();
    if (auth.user) await refreshMe();
  } catch (error) { toast(error.message || t("failed")); }
  if (auth.user) saveEntryChoice("account");
  else if (!auth.recovery && !entryChoice()) $("#entry-dialog").showModal();
  await loadFeedData();
  if ($("#trip-list [data-action='retry-feed']")) return;
  if (location.hash === "#settings") openSettings();
  else if (location.hash === "#routes") setPageView("explore");
  else if (location.hash === "#trips") setPageView("trips");
  else if (location.hash === "#saved") await openSavedTrips();
  const query = new URLSearchParams(location.search);
  if (query.has("route")) await openRoute(query.get("route"), false);
  else if (query.has("trip")) await openTrip(query.get("trip"), false);
  if (auth.recovery) openAuth("reset");
}
initialize();
