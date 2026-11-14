// Hand-made marks that break the grid on purpose: coffee rings, tape, scribbles,
// slanted section edges, and big outlined numbers at odd angles.

export function CoffeeRing({ className = "", size = 160, rotate = 0, opacity = 0.18 }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute ${className}`}
      style={{ width: size, height: size, transform: `rotate(${rotate}deg)`, opacity }}
    >
      <path
        d="M100 14 C150 12 188 52 186 102 C184 150 146 188 98 186 C52 184 14 148 16 100 C18 60 46 22 92 15"
        fill="none"
        stroke="var(--mark)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M100 26 C142 25 174 58 173 100 C172 140 140 173 100 172 C60 171 28 140 28 100"
        fill="none"
        stroke="var(--mark)"
        strokeWidth="2"
        opacity="0.6"
      />
      <path d="M160 160 C172 170 176 182 170 190" fill="none" stroke="var(--mark)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Tape({ className = "", rotate = -8, width = 92 }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 h-6 ${className}`}
      style={{
        width,
        transform: `rotate(${rotate}deg)`,
        background:
          "repeating-linear-gradient(90deg, color-mix(in srgb, var(--tape) 55%, transparent) 0 6px, color-mix(in srgb, var(--tape) 42%, transparent) 6px 9px)",
        clipPath: "polygon(3% 0, 97% 6%, 100% 50%, 96% 100%, 2% 94%, 0 45%)",
        boxShadow: "0 1px 0 rgb(20 14 11 / 0.12)",
      }}
    />
  );
}

export function Scribble({ className = "", width = 180, rotate = 0 }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 180 20"
      className={`pointer-events-none ${className}`}
      style={{ width, transform: `rotate(${rotate}deg)` }}
    >
      <path
        d="M2 12 C30 4 48 18 74 9 C98 1 118 17 142 8 C156 3 168 10 178 6"
        fill="none"
        stroke="var(--mark)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HandArrow({ className = "", rotate = 0 }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 80" className={`pointer-events-none ${className}`} style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M6 70 C28 30 62 18 104 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M90 10 L106 22 L92 36" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HandNote({ children, className = "", rotate = -4 }) {
  return (
    <span className={`font-hand pointer-events-none select-none text-2xl leading-none ${className}`} style={{ transform: `rotate(${rotate}deg)`, display: "inline-block" }}>
      {children}
    </span>
  );
}

// A slanted, slightly jagged band in the next section's colour along the bottom,
// so sections meet at an angle instead of a straight cut.
export function SlantEdge({ color, tilt = 1, jag = false }) {
  const l = tilt > 0 ? 70 : 0;
  const r = tilt > 0 ? 0 : 70;
  const mid = (t) => Math.round(l + (r - l) * t);
  const pts = jag
    ? [`0 ${l}%`, `14% ${mid(0.14) + 14}%`, `29% ${mid(0.29) - 6}%`, `45% ${mid(0.45) + 12}%`, `63% ${mid(0.63) - 8}%`, `81% ${mid(0.81) + 10}%`, `100% ${r}%`]
    : [`0 ${l}%`, `100% ${r}%`];
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-10 sm:h-16"
      style={{ background: color, clipPath: `polygon(${pts.join(", ")}, 100% 100%, 0 100%)` }}
    />
  );
}

export function OutlineNumber({ children, className = "", rotate = 0, dark = false }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute select-none font-display font-semibold leading-none ${className}`}
      style={{
        transform: `rotate(${rotate}deg)`,
        color: "transparent",
        WebkitTextStroke: `1.5px ${dark ? "rgb(244 238 230 / 0.22)" : "rgb(20 14 11 / 0.16)"}`,
      }}
    >
      {children}
    </div>
  );
}

export function StepTag({ children, rotate = -2, className = "" }) {
  return (
    <span
      className={`font-mono inline-block border border-current px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}

// A line-drawn cup with three steam wisps. Deliberately off-axis: the caller tilts and parks it at an edge.
export function SteamCup({ className = "", rotate = 6 }) {
  const wisps = [
    { d: "M52 66 C44 54 62 46 54 34 C50 28 56 24 54 18", delay: "0s" },
    { d: "M80 70 C72 56 90 48 82 34 C78 28 84 22 80 14", delay: "1.05s" },
    { d: "M108 66 C101 56 116 48 110 38 C107 33 111 30 110 24", delay: "2.1s" },
  ];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 170 150"
      className={`pointer-events-none absolute text-foreground ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {wisps.map((w, i) => (
        <path key={i} d={w.d} className="wisp" style={{ animationDelay: w.delay }} opacity="0.85" />
      ))}
      <path d="M30 84 C28 84 118 82 138 84 C140 118 128 138 84 140 C42 138 30 118 30 84 Z" />
      <path d="M138 94 C164 90 164 122 134 122" />
      <path d="M18 146 C60 152 110 152 156 146" opacity="0.6" />
      <path d="M44 100 C60 96 96 98 124 96" opacity="0.5" strokeWidth="1.6" />
    </svg>
  );
}
