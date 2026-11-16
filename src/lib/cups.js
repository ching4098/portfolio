// The cup collection. Coordinates are in a shared 170 x 170 viewBox, y down.
//  cavity    closed path of the space the drink can fill (also drives the physics)
//  fullFrac  fraction of the cavity a "100%" cup holds (the rest is head-room under the rim/lid)
//  lips      points the drink spills over, each with its outward direction (cup-local)
//  lipW      effective width of the spill, in units (rim width, or the sip hole)
//  flowK     weir coefficient; headMax caps the head for cups that restrict flow (lids)
//  mouth     where the moka pot aims; stream "open" ends on the surface, "lid" at the hole
//  scale/mass/col  size and weight of the toy and its capsule collider (cup units: centre, half-segment, radius)
//  pot       which refill device comes for this cup;  pour = stream outline / fill / droplet colours
//  open      overrides when the lid is off
//  drink     gradient (world-vertical, stops from local y0 to y1), surface line, crema band

export const CUPS = [
  {
    id: "espresso",
    scale: 0.82, mass: 1, pot: "moka", col: { c: [86, 124], h: [24, 0], r: 30 }, pour: ["#2A1A12", "#6B4228", "#7A4A2B"],
    name: "Espresso",
    origin: [85, 122],
    cavity: "M58 94 L112 94 C112 118 104 140 85 141 C66 140 58 118 58 94 Z",
    fullFrac: 0.78,
    lips: [
      { p: [58, 94], out: [-1, 0] },
      { p: [112, 94], out: [1, 0] },
    ],
    lipW: 54,
    flowK: 0.1,
    mouth: [85, 94],
    spread: 12,
    stream: "open",
    steam: [85, 94],
    knob: [38, 92],
    hit: "M50 94 C50 126 62 150 85 150 C108 150 120 126 120 94 Z M119 104 C142 100 142 130 114 128 Z M30 152 C60 162 110 162 140 152 Z",
    drink: { y0: 94, y1: 141, stops: [[0, "#3A2418"], [0.5, "#2A1A12"], [1, "#140E0B"]], surface: "#C8955B", crema: 6, cremaHi: "#E9C9A0" },
  },
  {
    id: "flat-white",
    scale: 0.98, mass: 1.5, pot: "pitcher", col: { c: [88, 118], h: [34, 0], r: 36 }, pour: ["#B07A4C", "#E9D9C4", "#C8955B"],
    name: "Flat white",
    origin: [85, 112],
    cavity: "M38 84 C30 98 40 132 85 138 C130 132 140 98 132 84 Z",
    fullFrac: 0.76,
    lips: [
      { p: [38, 84], out: [-1, 0] },
      { p: [132, 84], out: [1, 0] },
    ],
    lipW: 94,
    flowK: 0.1,
    mouth: [85, 84],
    spread: 24,
    stream: "open",
    steam: [85, 84],
    knob: [26, 80],
    heart: true,
    hit: "M36 84 C30 98 40 132 85 140 C130 132 140 98 134 84 Z M133 94 C162 88 162 124 128 122 Z M14 144 C60 156 110 156 156 144 Z",
    drink: { y0: 84, y1: 138, stops: [[0, "#B07A4C"], [0.35, "#C8955B"], [1, "#E9D9C4"]], surface: "#F4EEE6", crema: 2.5, cremaHi: "#F4EEE6" },
  },
  {
    id: "latte-glass",
    scale: 1.08, mass: 1.7, pot: "kettle", col: { c: [85, 95], h: [0, 28], r: 30 }, pour: ["#6B4228", "#C8955B", "#B07A4C"],
    name: "Latte",
    origin: [85, 96],
    cavity: "M59 42 L111 42 L107 142 L63 142 Z",
    fullFrac: 0.84,
    lips: [
      { p: [59, 42], out: [-1, 0] },
      { p: [111, 42], out: [1, 0] },
    ],
    lipW: 52,
    flowK: 0.1,
    mouth: [85, 42],
    spread: 10,
    stream: "open",
    steam: [85, 42],
    knob: [42, 38],
    hit: "M57 38 L113 38 L109 148 C108 153 62 153 61 148 Z",
    drink: {
      y0: 42,
      y1: 142,
      stops: [[0, "#F4EEE6"], [0.18, "#E9D9C4"], [0.55, "#C8955B"], [0.78, "#6B4228"], [1, "#2A1A12"]],
      surface: "#F4EEE6",
      crema: 2,
      cremaHi: "#F4EEE6",
    },
  },
  {
    id: "paper-cup",
    scale: 1, mass: 1.4, pot: "urn", col: { c: [85, 96], h: [0, 16], r: 40 }, pour: ["#3A2418", "#8C735F", "#6B4228"],
    dumpRate: 0.45,
    open: { lips: [{ p: [50, 54], out: [-1, 0] }, { p: [120, 54], out: [1, 0] }], lipW: 70, headMax: Infinity, mouth: [85, 54], spread: 14, stream: "open", dumpRate: 4.2 },
    name: "Takeaway coffee",
    origin: [85, 100],
    cavity: "M50 54 L120 54 L109 146 L61 146 Z",
    fullFrac: 0.8,
    lips: [{ p: [54, 51], out: [-1, 0] }],
    lipW: 9,
    flowK: 0.1,
    headMax: 65,
    mouth: [54, 51],
    spread: 2,
    stream: "lid",
    steam: [54, 48],
    knob: [30, 46],
    pourSign: -1,
    tipAngle: 128,
    hit: "M42 56 L44 46 C50 38 120 38 126 46 L128 56 L110 152 L60 152 Z",
    drink: { y0: 54, y1: 146, stops: [[0, "#6B4228"], [1, "#3A2418"]], surface: "#8C735F", crema: 2, cremaHi: "#B07A4C" },
  },
  {
    id: "diner-mug",
    scale: 1.05, mass: 2.2, pot: "carafe", col: { c: [86, 105], h: [10, 0], r: 47 }, pour: ["#4A2E1E", "#8C735F", "#4A2E1E"],
    name: "Americano",
    origin: [85, 106],
    cavity: "M51 62 L111 62 L111 138 C111 143 51 143 51 138 Z",
    fullFrac: 0.88,
    lips: [
      { p: [51, 62], out: [-1, 0] },
      { p: [111, 62], out: [1, 0] },
    ],
    lipW: 60,
    flowK: 0.1,
    mouth: [81, 62],
    spread: 18,
    stream: "open",
    steam: [81, 62],
    knob: [34, 58],
    hit: "M46 58 L116 58 L116 146 C116 152 46 152 46 146 Z M116 72 C154 66 154 128 116 124 Z",
    drink: { y0: 62, y1: 143, stops: [[0, "#4A2E1E"], [1, "#2A1A12"]], surface: "#8C735F", crema: 2, cremaHi: "#B07A4C" },
  },
];

export const CUP_IDS = CUPS.map((c) => c.id);
