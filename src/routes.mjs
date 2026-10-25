export const routes = [
  {
    id: "bokor-day",
    accent: "mountain",
    label: { en: "Mountain day", km: "ដំណើរឡើងភ្នំ" },
    title: { en: "Bokor Mountain Day", km: "មួយថ្ងៃនៅភ្នំបូកគោ" },
    summary: {
      en: "A flexible mountain day from Kampot. Leave daylight for the return and check the weather before setting off.",
      km: "ដំណើរឡើងភ្នំពីកំពត។ ទុកពេលត្រឡប់មុនងងឹត និងពិនិត្យអាកាសធាតុមុនចេញដំណើរ។"
    },
    duration: { en: "1 day", km: "១ ថ្ងៃ" },
    mode: { en: "Motorbike or car", km: "ម៉ូតូ ឬ រថយន្ត" },
    level: { en: "Plan for changing weather", km: "ត្រៀមខ្លួនសម្រាប់អាកាសធាតុប្រែប្រួល" },
    stops: [
      { en: "Kampot departure", km: "ចេញពីកំពត" },
      { en: "Bokor approach", km: "ផ្លូវឡើងបូកគោ" },
      { en: "Mountain viewpoints", km: "កន្លែងមើលទេសភាពលើភ្នំ" }
    ],
    costChecklist: [
      { en: "Fuel", km: "ប្រេងឥន្ធនៈ" },
      { en: "Food and water", km: "អាហារ និង ទឹក" },
      { en: "Any current entry or parking fees", km: "ថ្លៃចូល ឬ ចតយានយន្តបច្ចុប្បន្ន" }
    ],
    note: {
      en: "This is a planning guide, not live road or weather information. Confirm conditions on your travel day.",
      km: "នេះជាមគ្គុទ្ទេសក៍រៀបចំដំណើរ មិនមែនព័ត៌មានផ្លូវ ឬ អាកាសធាតុផ្ទាល់ទេ។ សូមពិនិត្យស្ថានភាពនៅថ្ងៃធ្វើដំណើរ។"
    },
    mapUrl: "https://www.google.com/maps/dir/?api=1&origin=Kampot%2C+Cambodia&destination=Bokor+Mountain%2C+Cambodia",
    sourceUrl: "https://themapcambodia.com/en/cambodia/motorbike",
    reviewedAt: "2026-10-25"
  },
  {
    id: "kampot-kep",
    accent: "coast",
    label: { en: "Coastal loop", km: "ដំណើរតាមឆ្នេរ" },
    title: { en: "Kampot to Kep", km: "កំពតទៅកែប" },
    summary: {
      en: "An easy-going coastal outing with room for food, viewpoints and unplanned stops.",
      km: "ដំណើរកម្សាន្តតាមឆ្នេរ ដែលអាចឈប់ញ៉ាំអាហារ មើលទេសភាព និង សម្រាកតាមចិត្ត។"
    },
    duration: { en: "Half or full day", km: "កន្លះថ្ងៃ ឬ ពេញមួយថ្ងៃ" },
    mode: { en: "Motorbike or car", km: "ម៉ូតូ ឬ រថយន្ត" },
    level: { en: "Flexible pace", km: "អាចកំណត់ល្បឿនតាមចិត្ត" },
    stops: [
      { en: "Kampot riverside", km: "មាត់ទន្លេកំពត" },
      { en: "Kep Crab Market", km: "ផ្សារក្តាមកែប" },
      { en: "Kep coastal viewpoints", km: "កន្លែងមើលទេសភាពឆ្នេរកែប" }
    ],
    costChecklist: [
      { en: "Fuel or transport", km: "ប្រេងឥន្ធនៈ ឬ ថ្លៃធ្វើដំណើរ" },
      { en: "Meals", km: "អាហារ" },
      { en: "Optional activities", km: "សកម្មភាពបន្ថែម" }
    ],
    note: {
      en: "Check opening hours, weather and road conditions before leaving. Prices vary by stop and season.",
      km: "សូមពិនិត្យម៉ោងបើក អាកាសធាតុ និង ស្ថានភាពផ្លូវមុនចេញដំណើរ។ តម្លៃអាចប្រែប្រួលតាមទីកន្លែង និង រដូវ។"
    },
    mapUrl: "https://www.google.com/maps/dir/?api=1&origin=Kampot%2C+Cambodia&destination=Kep%2C+Cambodia",
    sourceUrl: "https://themapcambodia.com/en/kampot/day-trips",
    reviewedAt: "2026-10-25"
  },
  {
    id: "coast-and-clouds",
    accent: "weekend",
    label: { en: "Weekend idea", km: "គម្រោងចុងសប្ដាហ៍" },
    title: { en: "Coast & Clouds Weekend", km: "ចុងសប្ដាហ៍ ឆ្នេរ និង ភ្នំ" },
    summary: {
      en: "A two-day idea linking Kampot, Kep and Bokor. Adapt the order to the weather and your group's pace.",
      km: "គម្រោងពីរថ្ងៃភ្ជាប់កំពត កែប និង បូកគោ។ អាចប្ដូរលំដាប់តាមអាកាសធាតុ និង ល្បឿនក្រុម។"
    },
    duration: { en: "2 days", km: "២ ថ្ងៃ" },
    mode: { en: "Motorbike or car", km: "ម៉ូតូ ឬ រថយន្ត" },
    level: { en: "Overnight planning", km: "ត្រូវរៀបចំការស្នាក់នៅមួយយប់" },
    stops: [
      { en: "Kampot base", km: "កំពត" },
      { en: "Kep coast", km: "ឆ្នេរកែប" },
      { en: "Bokor Mountain", km: "ភ្នំបូកគោ" }
    ],
    costChecklist: [
      { en: "Fuel or transport", km: "ប្រេងឥន្ធនៈ ឬ ថ្លៃធ្វើដំណើរ" },
      { en: "One night of accommodation", km: "កន្លែងស្នាក់នៅមួយយប់" },
      { en: "Food and activities", km: "អាហារ និង សកម្មភាព" }
    ],
    note: {
      en: "This is an example itinerary, not a verified live route. Check weather, lodging and current access before departure.",
      km: "នេះជាគម្រោងឧទាហរណ៍ មិនមែនព័ត៌មានផ្លូវផ្ទាល់ដែលបានផ្ទៀងផ្ទាត់ទេ។ សូមពិនិត្យអាកាសធាតុ កន្លែងស្នាក់ និង ការចូលទៅកាន់ទីតាំងមុនចេញដំណើរ។"
    },
    mapUrl: "https://www.google.com/maps/dir/?api=1&origin=Kampot%2C+Cambodia&destination=Bokor+Mountain%2C+Cambodia&waypoints=Kep%2C+Cambodia",
    sourceUrl: "https://themapcambodia.com/en/kampot/day-trips",
    reviewedAt: "2026-10-25"
  }
];

export const routeById = new Map(routes.map((route) => [route.id, route]));
