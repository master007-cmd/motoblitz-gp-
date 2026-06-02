'use strict';
/* =============================================
   MOTOBLITZ GP — Game Data
   (Riders, Bikes, Circuits)
   ============================================= */

// ─── RIDERS (12 riders) ─────────────────────
const RIDERS_DATA = [
  {
    id: 1, name: "Marco Valentini", short: "VAL", number: 46,
    country: "Italy", flag: "🇮🇹", team: "Ducati Factory",
    teamColor: "#e63946", helmetColor: "#ffd700", bikeId: 1,
    emoji: "🏍️",
    stats: { speed: 96, acceleration: 94, handling: 92, braking: 91 },
    bio: "The living legend, 10x World Champion"
  },
  {
    id: 2, name: "Hiroshi Tanaka", short: "TAN", number: 93,
    country: "Japan", flag: "🇯🇵", team: "Honda HRC",
    teamColor: "#d62828", helmetColor: "#ff4400", bikeId: 2,
    emoji: "⚡",
    stats: { speed: 94, acceleration: 91, handling: 95, braking: 93 },
    bio: "Precision rider, master of Honda machinery"
  },
  {
    id: 3, name: "Xavier Marquez", short: "MAR", number: 93,
    country: "Spain", flag: "🇪🇸", team: "Gresini Racing",
    teamColor: "#1a6bff", helmetColor: "#0044ff", bikeId: 1,
    emoji: "🔵",
    stats: { speed: 92, acceleration: 96, handling: 88, braking: 90 },
    bio: "Wild and fearless, son of Andalucia"
  },
  {
    id: 4, name: "Luca Bagnaia", short: "BAG", number: 1,
    country: "Italy", flag: "🇮🇹", team: "Ducati Lenovo",
    teamColor: "#cc1100", helmetColor: "#ffffff", bikeId: 1,
    emoji: "🔴",
    stats: { speed: 95, acceleration: 93, handling: 90, braking: 94 },
    bio: "World Champion, the Ducati Maestro"
  },
  {
    id: 5, name: "Fabio Quartarino", short: "QUA", number: 20,
    country: "France", flag: "🇫🇷", team: "Yamaha Factory",
    teamColor: "#0066cc", helmetColor: "#111111", bikeId: 3,
    emoji: "🇫🇷",
    stats: { speed: 90, acceleration: 88, handling: 97, braking: 89 },
    bio: "El Diablo, the smoothest rider on the grid"
  },
  {
    id: 6, name: "Brad Windstone", short: "WIN", number: 36,
    country: "Australia", flag: "🇦🇺", team: "Aprilia Racing",
    teamColor: "#ff6600", helmetColor: "#ff6600", bikeId: 5,
    emoji: "🦘",
    stats: { speed: 91, acceleration: 90, handling: 93, braking: 87 },
    bio: "The Kangaroo, fearless at Phillip Island"
  },
  {
    id: 7, name: "Miguel Olivarez", short: "OLI", number: 88,
    country: "Portugal", flag: "🇵🇹", team: "Pramac Racing",
    teamColor: "#ffd700", helmetColor: "#ffd700", bikeId: 1,
    emoji: "🟡",
    stats: { speed: 89, acceleration: 92, handling: 91, braking: 88 },
    bio: "The Samurai of Almada, rising star"
  },
  {
    id: 8, name: "Johann Zarco", short: "ZAR", number: 5,
    country: "France", flag: "🇫🇷", team: "LCR Honda",
    teamColor: "#00aaff", helmetColor: "#00aaff", bikeId: 2,
    emoji: "🔷",
    stats: { speed: 88, acceleration: 87, handling: 89, braking: 91 },
    bio: "The Astronaut, always reaching for the stars"
  },
  {
    id: 9, name: "Alex Rins", short: "RIN", number: 42,
    country: "Spain", flag: "🇪🇸", team: "LCR Honda",
    teamColor: "#005bbb", helmetColor: "#005bbb", bikeId: 2,
    emoji: "🔵",
    stats: { speed: 87, acceleration: 89, handling: 90, braking: 86 },
    bio: "Smooth operator, technical genius"
  },
  {
    id: 10, name: "Jack Miller", short: "MIL", number: 43,
    country: "Australia", flag: "🇦🇺", team: "KTM Factory",
    teamColor: "#ff6600", helmetColor: "#ff9900", bikeId: 6,
    emoji: "🧡",
    stats: { speed: 88, acceleration: 91, handling: 87, braking: 89 },
    bio: "Wild boy from Queensland, heart of a champion"
  },
  {
    id: 11, name: "Enea Bastianini", short: "BAS", number: 23,
    country: "Italy", flag: "🇮🇹", team: "Ducati Factory",
    teamColor: "#cc1100", helmetColor: "#333333", bikeId: 1,
    emoji: "👻",
    stats: { speed: 93, acceleration: 90, handling: 89, braking: 92 },
    bio: "La Bestia, unpredictable and devastating"
  },
  {
    id: 12, name: "Jorge Martin", short: "MAT", number: 89,
    country: "Spain", flag: "🇪🇸", team: "Prima Pramac",
    teamColor: "#ff0099", helmetColor: "#ff0099", bikeId: 1,
    emoji: "🌟",
    stats: { speed: 94, acceleration: 95, handling: 91, braking: 90 },
    bio: "Martinator, the fastest qualifier"
  },
];

// ─── BIKES (8 bikes) ─────────────────────────
const BIKES_DATA = [
  {
    id: 1, name: "Desmosedici GP24", brand: "Ducati",
    color: 0xcc1100, secondColor: 0xff3300, rimColor: 0xffd700,
    emoji: "🔴", icon: "🏍️",
    price: 0, unlocked: true,
    stats: { speed: 97, acceleration: 93, handling: 85, braking: 92 },
    description: "The fastest bike on the grid. Brutal power, demanding to ride.",
    maxSpeed: 340,   // km/h display
    engineNote: 0,   // 0 = V4
  },
  {
    id: 2, name: "RC213V", brand: "Honda",
    color: 0xd62828, secondColor: 0xffffff, rimColor: 0x888888,
    emoji: "🔴", icon: "🏍️",
    price: 0, unlocked: true,
    stats: { speed: 90, acceleration: 88, handling: 95, braking: 94 },
    description: "Technically superior handling. Precise and obedient.",
    maxSpeed: 315,
    engineNote: 1,
  },
  {
    id: 3, name: "YZR-M1", brand: "Yamaha",
    color: 0x0055bb, secondColor: 0x0088dd, rimColor: 0x333333,
    emoji: "🔵", icon: "🏍️",
    price: 0, unlocked: true,
    stats: { speed: 88, acceleration: 86, handling: 97, braking: 89 },
    description: "Balanced perfection. Smooth power delivery.",
    maxSpeed: 305,
    engineNote: 2,
  },
  {
    id: 4, name: "GSX-RR", brand: "Suzuki",
    color: 0x0066cc, secondColor: 0x4499ff, rimColor: 0xaaaaaa,
    emoji: "🔵", icon: "🏍️",
    price: 2500, unlocked: false,
    stats: { speed: 89, acceleration: 91, handling: 93, braking: 90 },
    description: "Sweet chassis, eager to turn. A fan favourite.",
    maxSpeed: 310,
    engineNote: 1,
  },
  {
    id: 5, name: "RS-GP24", brand: "Aprilia",
    color: 0xff6600, secondColor: 0xffaa00, rimColor: 0x222222,
    emoji: "🟠", icon: "🏍️",
    price: 3500, unlocked: false,
    stats: { speed: 91, acceleration: 89, handling: 91, braking: 91 },
    description: "The comeback kid. Balanced and powerful V4.",
    maxSpeed: 318,
    engineNote: 0,
  },
  {
    id: 6, name: "RC16 Factory", brand: "KTM",
    color: 0xff5500, secondColor: 0x333333, rimColor: 0xff5500,
    emoji: "🟠", icon: "🏍️",
    price: 4000, unlocked: false,
    stats: { speed: 88, acceleration: 94, handling: 88, braking: 88 },
    description: "Explosive acceleration. The Ready to Race machine.",
    maxSpeed: 308,
    engineNote: 3,
  },
  {
    id: 7, name: "ZX-RR GP", brand: "Kawasaki",
    color: 0x00aa00, secondColor: 0x00cc00, rimColor: 0x111111,
    emoji: "🟢", icon: "🏍️",
    price: 6000, unlocked: false,
    stats: { speed: 93, acceleration: 87, handling: 90, braking: 93 },
    description: "Green lightning. Built for champions.",
    maxSpeed: 325,
    engineNote: 2,
  },
  {
    id: 8, name: "M1000RR Prototype", brand: "BMW",
    color: 0x003399, secondColor: 0xffffff, rimColor: 0x0055cc,
    emoji: "🔵", icon: "🏍️",
    price: 9000, unlocked: false,
    stats: { speed: 96, acceleration: 90, handling: 89, braking: 96 },
    description: "German engineering unleashed. Braking beast.",
    maxSpeed: 335,
    engineNote: 1,
  },
];

// ─── CIRCUITS (8 circuits) ───────────────────
// Control points are [x, z] pairs forming a closed loop
// Scale: ~5 units = track width (8 units actual)

const CIRCUITS_DATA = [
  {
    id: 1,
    name: "Mugello Circuit",
    country: "Italy",
    flag: "🇮🇹",
    length: "5.245 km",
    corners: 15,
    defaultWeather: "sunny",
    environment: "hills",  // hills, desert, coastal, urban, flat
    ambientColor: 0x448822,
    // Waypoints form the Mugello layout - long back straight, technical infield
    waypoints: [
      [0,0],[25,-5],[55,-8],[80,-5],[95,5],[100,18],[95,32],[80,40],
      [60,42],[40,38],[25,45],[15,60],[20,75],[35,82],[55,80],[70,75],
      [80,65],[85,50],[80,35],[65,28],[50,25],[35,22],[20,18],[5,10],[0,0]
    ],
    startLine: [0, 0],
    startDirection: 1, // 1 = +X direction
    laps: 5,
    bestLap: "1:46.346"
  },
  {
    id: 2,
    name: "Sepang International",
    country: "Malaysia",
    flag: "🇲🇾",
    length: "5.543 km",
    corners: 15,
    defaultWeather: "cloudy",
    environment: "flat",
    ambientColor: 0x336611,
    waypoints: [
      [0,0],[30,0],[60,-5],[85,-15],[100,-30],[95,-50],[80,-60],[60,-55],
      [45,-45],[35,-35],[25,-40],[15,-55],[10,-70],[20,-85],[40,-90],[60,-85],
      [75,-70],[80,-55],[75,-40],[60,-35],[45,-30],[30,-20],[15,-10],[0,0]
    ],
    startLine: [0, 0],
    startDirection: 1,
    laps: 5,
    bestLap: "1:58.029"
  },
  {
    id: 3,
    name: "Phillip Island",
    country: "Australia",
    flag: "🇦🇺",
    length: "4.448 km",
    corners: 12,
    defaultWeather: "cloudy",
    environment: "coastal",
    ambientColor: 0x228855,
    waypoints: [
      [0,0],[35,-2],[65,-8],[85,-20],[90,-40],[80,-58],[60,-68],[35,-65],
      [15,-55],[5,-40],[0,-25],[5,-10],[0,0]
    ],
    startLine: [0, 0],
    startDirection: 1,
    laps: 5,
    bestLap: "1:28.605"
  },
  {
    id: 4,
    name: "Circuit de Catalunya",
    country: "Spain",
    flag: "🇪🇸",
    length: "4.657 km",
    corners: 16,
    defaultWeather: "sunny",
    environment: "hills",
    ambientColor: 0x886633,
    waypoints: [
      [0,0],[30,-2],[60,0],[80,8],[90,22],[85,38],[70,48],[50,50],
      [30,45],[15,38],[5,25],[0,10],[5,-5],[15,-18],[30,-25],[50,-20],
      [65,-10],[75,0],[80,12],[75,24],[60,30],[40,28],[20,22],[5,12],[0,0]
    ],
    startLine: [0, 0],
    startDirection: 1,
    laps: 5,
    bestLap: "1:38.975"
  },
  {
    id: 5,
    name: "Circuito de Jerez",
    country: "Spain",
    flag: "🇪🇸",
    length: "4.428 km",
    corners: 13,
    defaultWeather: "sunny",
    environment: "hills",
    ambientColor: 0x998855,
    waypoints: [
      [0,0],[25,0],[50,5],[65,15],[60,30],[45,40],[25,42],[10,35],
      [5,20],[10,8],[20,2],[35,-5],[50,-2],[60,8],[55,20],[40,25],
      [25,20],[10,15],[0,8],[0,0]
    ],
    startLine: [0, 0],
    startDirection: 1,
    laps: 5,
    bestLap: "1:38.170"
  },
  {
    id: 6,
    name: "Losail International",
    country: "Qatar",
    flag: "🇶🇦",
    length: "5.380 km",
    corners: 16,
    defaultWeather: "night",
    environment: "desert",
    ambientColor: 0xaa9966,
    waypoints: [
      [0,0],[40,-2],[80,0],[100,8],[105,22],[95,35],[75,40],[55,35],
      [40,25],[30,15],[20,20],[15,35],[20,50],[35,58],[55,55],[70,45],
      [80,35],[85,20],[80,5],[65,-2],[45,-5],[25,-3],[5,-1],[0,0]
    ],
    startLine: [0, 0],
    startDirection: 1,
    laps: 5,
    bestLap: "1:53.380"
  },
  {
    id: 7,
    name: "Misano World Circuit",
    country: "San Marino",
    flag: "🇸🇲",
    length: "4.226 km",
    corners: 16,
    defaultWeather: "sunny",
    environment: "coastal",
    ambientColor: 0x336644,
    waypoints: [
      [0,0],[20,-2],[40,0],[55,8],[60,20],[55,30],[40,35],[20,32],
      [5,25],[0,15],[5,5],[15,-2],[30,-5],[45,0],[55,10],[50,22],
      [35,28],[18,25],[5,18],[0,8],[0,0]
    ],
    startLine: [0, 0],
    startDirection: 1,
    laps: 6,
    bestLap: "1:31.618"
  },
  {
    id: 8,
    name: "Circuit Ricardo Tormo",
    country: "Spain",
    flag: "🇪🇸",
    length: "4.005 km",
    corners: 14,
    defaultWeather: "sunny",
    environment: "flat",
    ambientColor: 0x997755,
    waypoints: [
      [0,0],[25,-3],[48,0],[62,12],[58,28],[42,35],[22,32],[8,22],
      [5,10],[12,0],[25,-5],[40,-2],[52,8],[48,22],[35,28],[18,25],
      [5,18],[0,8],[0,0]
    ],
    startLine: [0, 0],
    startDirection: 1,
    laps: 6,
    bestLap: "1:30.609"
  },
];

// ─── CHAMPIONSHIP SEASONS ────────────────────
const CHAMPIONSHIP_DATA = {
  rounds: [1, 3, 5, 2, 6, 4, 7, 8, 1, 3], // circuit IDs for 10 rounds
  pointSystem: CONFIG.SCORE.CHAMPIONSHIP_POINTS,
};

// ─── CAREER PROGRESSION ─────────────────────
const CAREER_SEASONS = [
  { name: "Moto3 Academy",    bikeClass: "300cc", aiStrength: 0.65, reward: 1000 },
  { name: "Moto2 Rising",     bikeClass: "600cc", aiStrength: 0.75, reward: 2000 },
  { name: "MotoGP Rookie",    bikeClass: "1000cc", aiStrength: 0.85, reward: 4000 },
  { name: "MotoGP Champion",  bikeClass: "1000cc", aiStrength: 0.95, reward: 8000 },
  { name: "MotoGP Legend",    bikeClass: "1000cc", aiStrength: 1.0, reward: 15000 },
];

// ─── HELPER: Get rider by ID ─────────────────
function getRiderById(id) {
  return RIDERS_DATA.find(r => r.id === id) || RIDERS_DATA[0];
}

function getBikeById(id) {
  return BIKES_DATA.find(b => b.id === id) || BIKES_DATA[0];
}

function getCircuitById(id) {
  return CIRCUITS_DATA.find(c => c.id === id) || CIRCUITS_DATA[0];
}

// Generate a team name color from hex
function hexToCSS(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}
