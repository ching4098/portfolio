// The coffee palette, and the ground each section sits on.
// Espresso at the top, milk at the bottom: reading down the page is drinking the cup.
export const PALETTE = {
  espresso: "#140E0B",
  roast: "#2A1A12",
  darkCrema: "#3A2418",
  bark: "#4A2E1E",
  mocha: "#6B4228",
  dust: "#8C735F",
  crema: "#B07A4C",
  caramel: "#C8955B",
  steam: "#C9B8A6",
  honey: "#E9C9A0",
  latte: "#E9D9C4",
  milk: "#F4EEE6",
};
const P = PALETTE;

export const SECTION_ORDER = ["home", "work", "what-i-do", "projects", "publication", "education", "skills", "about", "contact"];

const dark = (o) => ({
  dark: true,
  fg: P.milk,
  muted: P.steam,
  border: "rgb(201 184 166 / 0.4)",
  primary: P.milk,
  primaryFg: P.espresso,
  mark: P.crema,
  tape: P.caramel,
  accent: P.caramel,
  ring: P.caramel,
  ...o,
});
const light = (o) => ({
  dark: false,
  fg: P.espresso,
  muted: P.mocha,
  border: "rgb(107 66 40 / 0.5)",
  primary: P.espresso,
  primaryFg: P.milk,
  mark: P.mocha,
  tape: P.crema,
  accent: P.bark,
  ring: P.espresso,
  ...o,
});

// bg: the section ground. rise: one step lighter, used by the milk-rise wipe.
export const GROUNDS = {
  home: dark({ bg: P.espresso, card: P.roast, cardAlt: P.darkCrema, rise: P.roast, wash: [P.darkCrema, P.espresso] }),
  work: dark({ bg: P.roast, card: P.darkCrema, cardAlt: P.bark, rise: P.darkCrema, wash: [P.darkCrema, P.roast] }),
  "what-i-do": dark({
    bg: P.mocha,
    card: P.bark,
    cardAlt: P.roast,
    muted: P.honey,
    accent: P.honey,
    ring: P.honey,
    mark: P.honey,
    tape: P.honey,
    border: "rgb(233 201 160 / 0.45)",
    rise: P.dust,
    wash: [P.bark, P.mocha],
  }),
  projects: light({ bg: P.latte, card: P.milk, cardAlt: P.honey, rise: P.milk }),
  publication: light({
    bg: P.crema,
    card: P.honey,
    cardAlt: P.latte,
    muted: P.roast,
    accent: P.espresso,
    mark: P.bark,
    border: "rgb(42 26 18 / 0.55)",
    rise: P.caramel,
  }),
  education: light({ bg: P.honey, card: P.milk, cardAlt: P.latte, rise: P.latte }),
  skills: dark({ bg: P.roast, card: P.darkCrema, cardAlt: P.bark, rise: P.darkCrema, wash: [P.darkCrema, P.roast] }),
  about: light({ bg: P.latte, card: P.milk, cardAlt: P.honey, rise: P.milk }),
  contact: light({ bg: P.milk, card: P.latte, cardAlt: P.honey, rise: P.milk }),
};

export function groundOf(id) {
  return GROUNDS[id] ?? GROUNDS.home;
}

export function nextGroundOf(id) {
  const i = SECTION_ORDER.indexOf(id);
  return GROUNDS[SECTION_ORDER[i + 1]] ?? null;
}

// CSS variables a section (or the sticky header) carries, so everything inside reads the same tokens.
export function groundVars(g) {
  return {
    "--background": g.bg,
    "--foreground": g.fg,
    "--muted-foreground": g.muted,
    "--border": g.border,
    "--input": g.border,
    "--card": g.card,
    "--card-foreground": g.fg,
    "--card-alt": g.cardAlt,
    "--popover": g.card,
    "--popover-foreground": g.fg,
    "--primary": g.primary,
    "--primary-foreground": g.primaryFg,
    "--secondary": g.card,
    "--secondary-foreground": g.fg,
    "--muted": g.card,
    "--accent": g.card,
    "--accent-foreground": g.fg,
    "--ring": g.ring,
    "--mark": g.mark,
    "--tape": g.tape,
    "--accent-text": g.accent,
  };
}
