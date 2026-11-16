// spout  tip of the spout (pot box coordinates);  pivot  point it tips about
// deg    tip angle while pouring;  aim  [dx, dy] of the spout tip from the cup's mouth, in cup units
// park   where the upright pot hovers before tipping (cup units, away from the cup / above the tip)
// fill   seconds to pour a full cup;  sw  stream width factor;  wk  size of the pot relative to the cup
// fly    the swoop flavour
export const POTS = {
  moka: { spout: [14, 29], pivot: [60, 80], deg: 52, aim: [6, 30], park: [70, 90], fill: 1.5, sw: 1, wk: 1, fly: "swoop", label: "moka pot" },
  pitcher: { spout: [8, 34], pivot: [60, 84], deg: 42, aim: [4, 22], park: [95, 14], fill: 1.9, sw: 0.9, wk: 1, fly: "slide", label: "milk pitcher" },
  kettle: { spout: [6, 30], pivot: [60, 84], deg: 34, aim: [0, 46], park: [80, 70], fill: 2.3, sw: 0.5, wk: 1.1, fly: "arc", label: "gooseneck kettle" },
  carafe: { spout: [16, 38], pivot: [60, 84], deg: 46, aim: [6, 28], park: [70, 80], fill: 2.2, sw: 1.1, wk: 1.05, fly: "swing", label: "carafe" },
  urn: { spout: [12, 130], pivot: [60, 84], deg: 4, aim: [0, 22], park: [0, 60], fill: 2, sw: 0.6, wk: 0.95, fly: "drop", label: "batch urn" },
};
