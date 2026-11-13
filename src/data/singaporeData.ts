export interface Initiative {
  id: string;
  title: string;
  charityName: string;
  ipcRef: string;
  sdgNumber: number;
  sdgLabel: string;
  sdgColor: string;
  category: 'Food Security' | 'Elder Care' | 'Coastal Ecology' | 'Youth Education';
  district: string;
  venueName: string;
  postalCode: string;
  mrtStation: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  nearestMrtCoords: {
    label: string;
    lat: number;
    lng: number;
  };
  imagePath: string;
  imageAlt: string;
  summary: string;
  enterprisePartner: string;
  matchMultiplierLabel: string;
  matchRatio: number;
  volunteerHourlyMatchSgd: number;
  goalSgd: number;
  citizenRaisedSgd: number;
  enterpriseMatchedSgd: number;
}

export interface SingaporeHoliday {
  date: string; // YYYY-MM-DD in SGT
  name: string;
  observed?: boolean;
}

export interface VolunteerShiftSlot {
  id: string;
  initiativeId: string;
  date: string; // YYYY-MM-DD in SGT
  startTimeSgt: string;
  endTimeSgt: string;
  durationHours: number;
  roleTitle: string;
  totalSpots: number;
  spotsTaken: number;
  leadCoordinator: string;
}

export interface VolunteerBooking {
  id: string;
  shiftId: string;
  initiativeId: string;
  initiativeTitle: string;
  charityName: string;
  venueName: string;
  postalCode: string;
  date: string;
  startTimeSgt: string;
  endTimeSgt: string;
  durationHours: number;
  roleTitle: string;
  volunteerName: string;
  volunteerEmail: string;
  volunteerPhone: string;
  matchedImpactSgd: number;
  status: 'Confirmed' | 'Reminder Sent';
  whatsappMessageId?: string;
  createdAt: string;
}

export interface SgdPledgeRecord {
  id: string;
  initiativeId: string;
  initiativeTitle: string;
  donorName: string;
  citizenAmountSgd: number;
  enterpriseMatchedSgd: number;
  totalImpactSgd: number;
  enterprisePartner: string;
  createdAt: string;
}

export const HERO_IMAGE = '/src/assets/images/hero_singapore_volunteers_1794553994391.jpg';

export const SINGAPORE_PUBLIC_HOLIDAYS: SingaporeHoliday[] = [
  // 2026 Singapore Public Holidays (MOM)
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-02-17', name: 'Chinese New Year' },
  { date: '2026-02-18', name: 'Chinese New Year (Day 2)' },
  { date: '2026-03-21', name: 'Hari Raya Puasa' },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-05-01', name: 'Labour Day' },
  { date: '2026-05-27', name: 'Hari Raya Haji' },
  { date: '2026-05-31', name: 'Vesak Day' },
  { date: '2026-06-01', name: 'Vesak Day (Observed)', observed: true },
  { date: '2026-08-09', name: 'National Day' },
  { date: '2026-08-10', name: 'National Day (Observed)', observed: true },
  { date: '2026-11-08', name: 'Deepavali' },
  { date: '2026-11-09', name: 'Deepavali (Observed)', observed: true },
  { date: '2026-12-25', name: 'Christmas Day' },
  // 2027 Singapore Public Holidays (MOM)
  { date: '2027-01-01', name: "New Year's Day" },
  { date: '2027-02-06', name: 'Chinese New Year' },
  { date: '2027-02-07', name: 'Chinese New Year (Day 2)' },
  { date: '2027-02-08', name: 'Chinese New Year (Observed)', observed: true },
  { date: '2027-03-10', name: 'Hari Raya Puasa' },
  { date: '2027-03-26', name: 'Good Friday' },
  { date: '2027-05-01', name: 'Labour Day' },
  { date: '2027-05-17', name: 'Hari Raya Haji' },
  { date: '2027-05-20', name: 'Vesak Day' },
  { date: '2027-08-09', name: 'National Day' },
  { date: '2027-10-29', name: 'Deepavali' },
  { date: '2027-12-25', name: 'Christmas Day' },
];

export const INITIAL_INITIATIVES: Initiative[] = [
  {
    id: 'init-food-rescue',
    title: 'Tampines Fresh Food Rescue & Care Packs',
    charityName: 'Heartland Harvest Singapore',
    ipcRef: 'IPC-000842',
    sdgNumber: 2,
    sdgLabel: 'SDG 2 · Zero Hunger',
    sdgColor: '#DDA63A',
    category: 'Food Security',
    district: 'Tampines',
    venueName: 'Our Tampines Hub Community Pantry',
    postalCode: 'Singapore 528523',
    mrtStation: 'Tampines MRT (EW2 / DT32)',
    coordinates: { lat: 1.35314, lng: 103.94013 },
    nearestMrtCoords: {
      label: 'Tampines MRT Exit B',
      lat: 1.354079,
      lng: 103.945149,
    },
    imagePath: '/src/assets/images/initiative_food_rescue_1794553995910.jpg',
    imageAlt: 'Singapore community volunteers sorting fresh leafy vegetables and pantry staples at Tampines Hub.',
    summary:
      'Sort rescued market produce and assemble weekly halal-certified grocery bundles for 320 lower-income households across Tampines East and Changkat.',
    enterprisePartner: 'DBS Foundation',
    matchMultiplierLabel: '1:1 Matched',
    matchRatio: 1.0,
    volunteerHourlyMatchSgd: 28,
    goalSgd: 45000,
    citizenRaisedSgd: 19400,
    enterpriseMatchedSgd: 19400,
  },
  {
    id: 'init-senior-wellness',
    title: 'Kallang Senior Wellness & Tea Befriending',
    charityName: 'SilverBridge Active Ageing',
    ipcRef: 'IPC-001194',
    sdgNumber: 3,
    sdgLabel: 'SDG 3 · Good Health',
    sdgColor: '#4C9F38',
    category: 'Elder Care',
    district: 'Kallang',
    venueName: 'Kallang Active Ageing Hub, Block 38',
    postalCode: 'Singapore 330038',
    mrtStation: 'Kallang MRT (EW10)',
    coordinates: { lat: 1.31195, lng: 103.86741 },
    nearestMrtCoords: {
      label: 'Kallang MRT Exit A',
      lat: 1.311489,
      lng: 103.871387,
    },
    imagePath: '/src/assets/images/initiative_senior_befriending_1794553994171.jpg',
    imageAlt: 'Volunteer chatting over warm tea and reviewing a schedule with an elderly resident in Kallang.',
    summary:
      'Host bilingual digital literacy check-ins, blood pressure logging, and afternoon Kopi sessions for solo seniors living in rental flats along Boon Keng and Kallang.',
    enterprisePartner: 'OCBC Cares',
    matchMultiplierLabel: '1:1 Matched',
    matchRatio: 1.0,
    volunteerHourlyMatchSgd: 25,
    goalSgd: 28000,
    citizenRaisedSgd: 11850,
    enterpriseMatchedSgd: 11850,
  },
  {
    id: 'init-mangrove-restoration',
    title: 'Pasir Ris Mangrove Sapling & Coastal Care',
    charityName: 'Straits Shoreline Stewardship',
    ipcRef: 'IPC-000637',
    sdgNumber: 14,
    sdgLabel: 'SDG 14 · Life Below Water',
    sdgColor: '#0A97D9',
    category: 'Coastal Ecology',
    district: 'Pasir Ris',
    venueName: 'Pasir Ris Mangrove Boardwalk Station 2',
    postalCode: 'Singapore 519462',
    mrtStation: 'Pasir Ris MRT (EW1)',
    coordinates: { lat: 1.37921, lng: 103.95248 },
    nearestMrtCoords: {
      label: 'Pasir Ris MRT Bus Interchange',
      lat: 1.373034,
      lng: 103.949272,
    },
    imagePath: '/src/assets/images/initiative_mangrove_cleanup_1794553993916.jpg',
    imageAlt: 'Community volunteers planting mangrove saplings along a wooden boardwalk in Pasir Ris.',
    summary:
      'Plant native Rhizophora propagules during low tide and catalogue marine plastics along the Sungei Tampines estuary under NParks coastal guidelines.',
    enterprisePartner: 'Keppel Sustainability Fund',
    matchMultiplierLabel: '1.5x Matched',
    matchRatio: 1.5,
    volunteerHourlyMatchSgd: 35,
    goalSgd: 36000,
    citizenRaisedSgd: 11200,
    enterpriseMatchedSgd: 16800,
  },
  {
    id: 'init-youth-literacy',
    title: 'Jurong East Youth Reading & STEM Studio',
    charityName: 'WestCoast Learning Collective',
    ipcRef: 'IPC-001408',
    sdgNumber: 4,
    sdgLabel: 'SDG 4 · Quality Education',
    sdgColor: '#C5192D',
    category: 'Youth Education',
    district: 'Jurong East',
    venueName: 'Jurong Regional Study Annex, Level 3',
    postalCode: 'Singapore 609732',
    mrtStation: 'Jurong East MRT (EW24 / NS1)',
    coordinates: { lat: 1.33291, lng: 103.73915 },
    nearestMrtCoords: {
      label: 'Jurong East MRT Exit B',
      lat: 1.333152,
      lng: 103.742286,
    },
    imagePath: '/src/assets/images/initiative_youth_literacy_1794553995257.jpg',
    imageAlt: 'Volunteer mentor assisting primary school students with science notebooks in Jurong East.',
    summary:
      'Provide small-group reading coaching and primary science homework support for P3–P6 students from ComLink+ families in Jurong and Bukit Batok.',
    enterprisePartner: 'CapitaLand Hope Foundation',
    matchMultiplierLabel: '1:1 Matched',
    matchRatio: 1.0,
    volunteerHourlyMatchSgd: 30,
    goalSgd: 32000,
    citizenRaisedSgd: 13600,
    enterpriseMatchedSgd: 13600,
  },
];

export const SINGAPORE_PRESET_ORIGINS = [
  { label: 'Novena MRT (Sample OneMap Origin)', coords: '1.320981,103.844150' },
  { label: 'Tampines MRT (EW2 / DT32)', coords: '1.354079,103.945149' },
  { label: 'Kallang MRT (EW10)', coords: '1.311489,103.871387' },
  { label: 'Pasir Ris MRT (EW1)', coords: '1.373034,103.949272' },
  { label: 'Jurong East MRT (EW24 / NS1)', coords: '1.333152,103.742286' },
  { label: 'Raffles Place MRT (NS26 / EW14)', coords: '1.283933,103.851463' },
];

export const ONEMAP_SAMPLE_DESTINATIONS = [
  { label: 'Whampoa / Balestier (Sample OneMap End)', coords: '1.326762,103.8559' },
  ...INITIAL_INITIATIVES.map((item) => ({
    label: `${item.venueName} (${item.district})`,
    coords: `${item.coordinates.lat},${item.coordinates.lng}`,
  })),
];

// Generate realistic Singapore volunteer shifts across Nov 2026 - Jan 2027
export const INITIAL_SHIFT_SLOTS: VolunteerShiftSlot[] = [
  {
    id: 'shift-2026-11-14-food',
    initiativeId: 'init-food-rescue',
    date: '2026-11-14',
    startTimeSgt: '08:30',
    endTimeSgt: '11:30',
    durationHours: 3,
    roleTitle: 'Produce Sorting & Pack Lead',
    totalSpots: 18,
    spotsTaken: 13,
    leadCoordinator: 'Mei Ling Tan',
  },
  {
    id: 'shift-2026-11-14-mangrove',
    initiativeId: 'init-mangrove-restoration',
    date: '2026-11-14',
    startTimeSgt: '07:30',
    endTimeSgt: '10:30',
    durationHours: 3,
    roleTitle: 'Low-Tide Sapling Planter',
    totalSpots: 20,
    spotsTaken: 14,
    leadCoordinator: 'Arvind Nair',
  },
  {
    id: 'shift-2026-11-15-senior',
    initiativeId: 'init-senior-wellness',
    date: '2026-11-15',
    startTimeSgt: '14:00',
    endTimeSgt: '17:00',
    durationHours: 3,
    roleTitle: 'Bilingual Tea Befriender',
    totalSpots: 12,
    spotsTaken: 7,
    leadCoordinator: 'Siti Nurhaliza',
  },
  {
    id: 'shift-2026-11-18-youth',
    initiativeId: 'init-youth-literacy',
    date: '2026-11-18',
    startTimeSgt: '16:30',
    endTimeSgt: '18:30',
    durationHours: 2,
    roleTitle: 'Primary Literacy Mentor',
    totalSpots: 10,
    spotsTaken: 6,
    leadCoordinator: 'Marcus Lim',
  },
  {
    id: 'shift-2026-11-21-food',
    initiativeId: 'init-food-rescue',
    date: '2026-11-21',
    startTimeSgt: '09:00',
    endTimeSgt: '12:00',
    durationHours: 3,
    roleTitle: 'Household Pack Distribution',
    totalSpots: 16,
    spotsTaken: 9,
    leadCoordinator: 'Mei Ling Tan',
  },
  {
    id: 'shift-2026-11-21-youth',
    initiativeId: 'init-youth-literacy',
    date: '2026-11-21',
    startTimeSgt: '10:00',
    endTimeSgt: '13:00',
    durationHours: 3,
    roleTitle: 'STEM Workbook Coach',
    totalSpots: 12,
    spotsTaken: 5,
    leadCoordinator: 'Marcus Lim',
  },
  {
    id: 'shift-2026-11-22-mangrove',
    initiativeId: 'init-mangrove-restoration',
    date: '2026-11-22',
    startTimeSgt: '08:00',
    endTimeSgt: '11:00',
    durationHours: 3,
    roleTitle: 'Estuary Debris Audit',
    totalSpots: 15,
    spotsTaken: 8,
    leadCoordinator: 'Arvind Nair',
  },
  {
    id: 'shift-2026-11-25-senior',
    initiativeId: 'init-senior-wellness',
    date: '2026-11-25',
    startTimeSgt: '10:00',
    endTimeSgt: '12:30',
    durationHours: 2.5,
    roleTitle: 'Scam-Shield & Healthapp Coach',
    totalSpots: 10,
    spotsTaken: 4,
    leadCoordinator: 'Siti Nurhaliza',
  },
  {
    id: 'shift-2026-11-28-food',
    initiativeId: 'init-food-rescue',
    date: '2026-11-28',
    startTimeSgt: '08:30',
    endTimeSgt: '11:30',
    durationHours: 3,
    roleTitle: 'Fresh Produce Intake',
    totalSpots: 18,
    spotsTaken: 10,
    leadCoordinator: 'Mei Ling Tan',
  },
  {
    id: 'shift-2026-12-05-senior',
    initiativeId: 'init-senior-wellness',
    date: '2026-12-05',
    startTimeSgt: '14:00',
    endTimeSgt: '17:00',
    durationHours: 3,
    roleTitle: 'Year-End Kopi Gathering Host',
    totalSpots: 14,
    spotsTaken: 6,
    leadCoordinator: 'Siti Nurhaliza',
  },
  {
    id: 'shift-2026-12-12-mangrove',
    initiativeId: 'init-mangrove-restoration',
    date: '2026-12-12',
    startTimeSgt: '07:30',
    endTimeSgt: '10:30',
    durationHours: 3,
    roleTitle: 'Mangrove Nursery Care',
    totalSpots: 20,
    spotsTaken: 7,
    leadCoordinator: 'Arvind Nair',
  },
  {
    id: 'shift-2026-12-19-food',
    initiativeId: 'init-food-rescue',
    date: '2026-12-19',
    startTimeSgt: '08:30',
    endTimeSgt: '12:00',
    durationHours: 3.5,
    roleTitle: 'Festive Care Pack Assembly',
    totalSpots: 24,
    spotsTaken: 11,
    leadCoordinator: 'Mei Ling Tan',
  },
  {
    id: 'shift-2026-12-25-senior',
    initiativeId: 'init-senior-wellness',
    date: '2026-12-25',
    startTimeSgt: '10:00',
    endTimeSgt: '13:00',
    durationHours: 3,
    roleTitle: 'Christmas Day Senior Lunch Companion',
    totalSpots: 16,
    spotsTaken: 9,
    leadCoordinator: 'Siti Nurhaliza',
  },
];

export const INITIAL_BOOKINGS: VolunteerBooking[] = [
  {
    id: 'bk-sg-001',
    shiftId: 'shift-2026-11-14-food',
    initiativeId: 'init-food-rescue',
    initiativeTitle: 'Tampines Fresh Food Rescue & Care Packs',
    charityName: 'Heartland Harvest Singapore',
    venueName: 'Our Tampines Hub Community Pantry',
    postalCode: 'Singapore 528523',
    date: '2026-11-14',
    startTimeSgt: '08:30',
    endTimeSgt: '11:30',
    durationHours: 3,
    roleTitle: 'Produce Sorting & Pack Lead',
    volunteerName: 'Alicia Low',
    volunteerEmail: 'alicialow1819@gmail.com',
    volunteerPhone: '6591234567',
    matchedImpactSgd: 84,
    status: 'Confirmed',
    createdAt: '2026-11-10T09:15:00+08:00',
  },
  {
    id: 'bk-sg-002',
    shiftId: 'shift-2026-11-22-mangrove',
    initiativeId: 'init-mangrove-restoration',
    initiativeTitle: 'Pasir Ris Mangrove Sapling & Coastal Care',
    charityName: 'Straits Shoreline Stewardship',
    venueName: 'Pasir Ris Mangrove Boardwalk Station 2',
    postalCode: 'Singapore 519462',
    date: '2026-11-22',
    startTimeSgt: '08:00',
    endTimeSgt: '11:00',
    durationHours: 3,
    roleTitle: 'Estuary Debris Audit',
    volunteerName: 'Alicia Low',
    volunteerEmail: 'alicialow1819@gmail.com',
    volunteerPhone: '6591234567',
    matchedImpactSgd: 105,
    status: 'Confirmed',
    createdAt: '2026-11-11T14:20:00+08:00',
  },
];

export const INITIAL_PLEDGES: SgdPledgeRecord[] = [
  {
    id: 'pl-101',
    initiativeId: 'init-food-rescue',
    initiativeTitle: 'Tampines Fresh Food Rescue & Care Packs',
    donorName: 'Alicia Low',
    citizenAmountSgd: 100,
    enterpriseMatchedSgd: 100,
    totalImpactSgd: 200,
    enterprisePartner: 'DBS Foundation',
    createdAt: '2026-11-08T18:40:00+08:00',
  },
  {
    id: 'pl-102',
    initiativeId: 'init-mangrove-restoration',
    initiativeTitle: 'Pasir Ris Mangrove Sapling & Coastal Care',
    donorName: 'Wei Jie Goh',
    citizenAmountSgd: 150,
    enterpriseMatchedSgd: 225,
    totalImpactSgd: 375,
    enterprisePartner: 'Keppel Sustainability Fund',
    createdAt: '2026-11-09T11:10:00+08:00',
  },
];

const sgdFormatter = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const sgdCompactFormatter = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatSgd(amount: number, showDecimals = true): string {
  return showDecimals
    ? sgdFormatter.format(amount)
    : sgdCompactFormatter.format(amount);
}

export function getSingaporeTodayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function formatSgReadableDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(Date.UTC(y, m - 1, d, 4, 0, 0));
  return new Intl.DateTimeFormat('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(dt);
}
