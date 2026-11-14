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
        stroke="var(--crema)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M100 26 C142 25 174 58 173 100 C172 140 140 173 100 172 C60 171 28 140 28 100"
        fill="none"
        stroke="var(--crema)"
        strokeWidth="2"
        opacity="0.6"
      />
      <path d="M160 160 C172 170 176 182 170 190" fill="none" stroke="var(--crema)" strokeWidth="4" strokeLinecap="round" />
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
        background: "repeating-linear-gradient(90deg, rgb(176 122 76 / 0.42) 0 6px, rgb(176 122 76 / 0.32) 6px 9px)",
        clipPath: "polygon(3% 0, 97% 6%, 100% 50%, 96% 100%, 2% 94%, 0 45%)",
        boxShadow: "0 1px 0 rgb(0 0 0 / 0.08)",
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
        stroke="var(--crema)"
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
export function SlantEdge({ toInk, tilt = 1, jag = false }) {
  const color = toInk ? "var(--ink)" : "var(--paper)";
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

export function OutlineNumber({ children, className = "", rotate = 0, tone = "paper" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute select-none font-display font-extrabold leading-none ${className}`}
      style={{
        transform: `rotate(${rotate}deg)`,
        color: "transparent",
        WebkitTextStroke: `1.5px ${tone === "ink" ? "rgb(250 250 250 / 0.22)" : "rgb(20 20 20 / 0.16)"}`,
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
