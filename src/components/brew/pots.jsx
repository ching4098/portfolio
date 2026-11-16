// The refill devices, one per cup. All drawn in the same 120 x 150 box, spout pointing left,
// hand-made line art. `spout` is the tip the stream leaves from, `pivot` the point the pot tips about.

const COMMON = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2.6, stroke: "#2A1A12" };

function Moka() {
  return (
    <>
      <path d="M42 84 L78 84 L92 138 L28 138 Z" fill="#C9B8A6" />
      <path d="M34 36 L86 36 L78 84 L42 84 Z" fill="#E9D9C4" />
      <path d="M36 22 L84 22 L86 36 L34 36 Z" fill="#B07A4C" />
      <circle cx="60" cy="15" r="5.5" fill="#2A1A12" />
      <path d="M34 36 C28 36 22 33 14 29 C22 25 30 28 37 29" fill="#E9D9C4" />
      <path d="M37 82 L83 82 L83 90 L37 90 Z" fill="#8C735F" />
      <path d="M86 42 C116 36 116 84 80 80" strokeWidth="6" />
      <path d="M86 42 C112 38 112 80 81 78" stroke="#8C735F" strokeWidth="2" />
      <path d="M44 48 L48 78 M54 48 L56 78" stroke="#8C735F" strokeWidth="1.5" opacity="0.7" />
      <path d="M36 100 L42 130 M46 98 L50 130" stroke="#8C735F" strokeWidth="1.5" opacity="0.7" />
      <path d="M26 144 C50 148 78 148 98 144" opacity="0.5" strokeWidth="1.6" />
    </>
  );
}

// Steaming jug with a pointed spout.
function Pitcher() {
  return (
    <>
      <path d="M36 46 C28 80 24 108 34 132 C50 138 70 138 86 132 C96 108 92 80 84 46 Z" fill="#C9B8A6" />
      <path d="M36 46 C28 44 18 40 8 34 C20 37 30 36 41 40" fill="#C9B8A6" />
      <path d="M34 46 L86 46" />
      <path d="M31 92 C50 96 72 96 90 92" stroke="#8C735F" strokeWidth="1.6" opacity="0.7" />
      <path d="M38 60 C34 80 32 96 36 116" stroke="#F4EEE6" strokeWidth="2.4" opacity="0.8" />
      <path d="M86 56 C118 50 118 104 84 110" strokeWidth="6" />
      <path d="M86 57 C114 52 114 100 85 108" stroke="#8C735F" strokeWidth="2" />
      <path d="M62 44 L68 16" strokeWidth="1.8" />
      <circle cx="68" cy="14" r="3" fill="#E9C9A0" strokeWidth="1.8" />
    </>
  );
}

// Gooseneck pour-over kettle.
function Kettle() {
  return (
    <>
      <path d="M82 76 C112 68 114 114 82 114" strokeWidth="6" />
      <path d="M82 77 C108 72 110 110 83 112" stroke="#8C735F" strokeWidth="2" />
      <path d="M30 72 C26 92 26 112 30 128 C48 134 66 134 84 128 C88 112 88 92 84 72 Z" fill="#E9D9C4" />
      <path d="M30 72 C34 58 80 58 84 72" fill="#C9B8A6" />
      <path d="M42 60 C46 50 68 50 72 60 Z" fill="#B07A4C" />
      <circle cx="57" cy="46" r="4.5" fill="#2A1A12" />
      <path d="M32 114 C12 110 8 86 20 68 C26 58 12 46 6 30" strokeWidth="6.4" />
      <path d="M32 114 C12 110 8 86 20 68 C26 58 12 46 6 30" stroke="#E9D9C4" strokeWidth="2.4" />
      <path d="M36 92 C50 96 64 96 80 92" stroke="#8C735F" strokeWidth="1.5" opacity="0.7" />
      <path d="M38 84 L38 118" stroke="#F4EEE6" strokeWidth="2.2" opacity="0.8" />
    </>
  );
}

// Glass drip-coffee carafe with a black handle.
function Carafe() {
  return (
    <>
      <path d="M92 54 C120 54 122 102 90 114" strokeWidth="7" />
      <path d="M38 48 L92 48 C92 66 82 74 84 86 C86 100 94 112 92 130 C90 138 40 138 38 130 C36 112 44 100 46 86 C48 74 38 66 38 48 Z" fill="#E9D9C4" fillOpacity="0.45" />
      <path d="M45 98 C44 108 38 118 39 129 C44 136 86 136 91 129 C92 118 86 108 85 98 Z" fill="#6B4228" fillOpacity="0.85" stroke="none" />
      <path d="M45 98 C60 101 70 95 85 98" stroke="#C8955B" strokeWidth="1.8" />
      <path d="M38 48 C30 48 22 44 16 38" />
      <path d="M36 48 L94 48" strokeWidth="3" />
      <path d="M46 56 C46 66 50 72 52 80" stroke="#F4EEE6" strokeWidth="2.4" opacity="0.8" />
      <path d="M44 140 L86 140" opacity="0.5" strokeWidth="1.8" />
    </>
  );
}

// Batch-brew urn with a tap at the bottom.
function Urn() {
  return (
    <>
      <path d="M86 50 C108 50 108 98 86 98" strokeWidth="6" />
      <path d="M34 26 L86 26 L86 108 C86 114 34 114 34 108 Z" fill="#C9B8A6" />
      <path d="M34 26 C34 14 86 14 86 26 Z" fill="#B07A4C" />
      <path d="M56 14 L64 14 L64 6 L56 6 Z" fill="#2A1A12" />
      <path d="M34 60 L86 60 M34 66 L86 66" stroke="#8C735F" strokeWidth="1.5" />
      <path d="M76 36 L76 54" stroke="#F4EEE6" strokeWidth="2.6" opacity="0.85" />
      <path d="M38 86 L38 102" stroke="#F4EEE6" strokeWidth="2.2" opacity="0.6" />
      <path d="M34 98 L18 98 L12 104 L12 130" strokeWidth="5.4" />
      <path d="M34 98 L18 98 L12 104 L12 130" stroke="#E9D9C4" strokeWidth="1.8" />
      <circle cx="22" cy="90" r="4" fill="#2A1A12" />
      <path d="M30 114 L90 114" opacity="0.5" strokeWidth="1.6" />
    </>
  );
}

const ART = { moka: Moka, pitcher: Pitcher, kettle: Kettle, carafe: Carafe, urn: Urn };

export function PotArt({ id, flipRef }) {
  const Art = ART[id] || Moka;
  return (
    <svg ref={flipRef} viewBox="0 0 120 150" className="h-full w-full" {...COMMON}>
      <Art />
    </svg>
  );
}
