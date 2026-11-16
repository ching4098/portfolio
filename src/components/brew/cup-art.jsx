// Line art for each cup. Drawn over the liquid, in the shared 170 x 170 viewBox, stroke = currentColor.

const GLASS = { fill: "currentColor", fillOpacity: 0.06 };

const ART = {
  espresso: (
    <>
      <path d="M50 94 C50 126 62 150 85 150 C108 150 120 126 120 94" strokeWidth="2.8" />
      <path d="M50 94 L58 94 M112 94 L120 94" />
      <path d="M58 94 C58 118 66 140 85 141 C104 140 112 118 112 94" opacity="0.45" strokeWidth="1.5" />
      <path d="M119 104 C142 100 142 130 114 128" strokeWidth="2.8" />
      <path d="M128 109 C136 109 136 121 124 122" opacity="0.5" strokeWidth="1.4" />
      <path d="M30 152 C60 160 110 160 140 152" />
      <path d="M62 150 C64 156 106 156 108 150" opacity="0.5" strokeWidth="1.6" />
      <path d="M62 112 C64 124 68 132 74 138" opacity="0.4" strokeWidth="1.5" />
    </>
  ),
  "flat-white": (
    <>
      <path d="M38 84 C30 98 40 132 85 138 C130 132 140 98 132 84" />
      <path d="M36 84 L134 84" strokeWidth="2.2" />
      <path d="M133 94 C162 88 162 124 128 122" />
      <path d="M133 103 C150 100 150 114 130 114" opacity="0.5" strokeWidth="1.4" />
      <path d="M14 144 C60 152 110 152 156 144" />
      <path d="M16 144 C24 156 146 156 154 144" opacity="0.7" strokeWidth="1.8" />
      <path d="M68 137 C70 143 100 143 102 137" opacity="0.55" strokeWidth="1.6" />
      <path d="M48 98 C52 94 70 93 84 93" opacity="0.4" strokeWidth="1.5" />
    </>
  ),
  "latte-glass": (
    <>
      <path d="M57 38 L113 38 L109 148 C108 152 62 152 61 148 Z" {...GLASS} />
      <path d="M59 42 L63 142 M111 42 L107 142" opacity="0.35" strokeWidth="1.4" />
      <path d="M63 142 L107 142" opacity="0.45" strokeWidth="1.4" />
      <path d="M67 52 L69 120" opacity="0.5" strokeWidth="2.4" stroke="#F4EEE6" />
      <path d="M68 130 L69 136" opacity="0.5" strokeWidth="2.4" stroke="#F4EEE6" />
    </>
  ),
  "paper-cup": (
    <>
      <path d="M48 56 L61 150 C70 154 100 154 109 150 L122 56 Z" fill="#F4EEE6" fillOpacity="0.1" />
      <path d="M52 84 L118 84 L113 124 L57 124 Z" fill="#C8955B" fillOpacity="0.35" />
      <path d="M53 94 L117 94 M55 104 L115 104 M56 114 L114 114" opacity="0.45" strokeWidth="1.4" />
      <path d="M80 98 C80 90 90 90 90 98 C90 104 85 108 85 108 C85 108 80 104 80 98 Z" opacity="0.7" strokeWidth="1.6" />
      <path d="M41 56 L129 56 L127 49 L43 49 Z" fill="#F4EEE6" fillOpacity="0.16" />
      <path d="M47 49 C52 40 118 40 123 49" />
      <path d="M46 52 L124 52" opacity="0.4" strokeWidth="1.4" />
      <path d="M49 52 C50 46 58 46 59 52" strokeWidth="2.6" />
      <path d="M52 51 L56 51" stroke="#8C735F" strokeWidth="3.4" />
    </>
  ),
  "diner-mug": (
    <>
      <path d="M46 58 L116 58 L116 146 C116 152 46 152 46 146 Z" strokeWidth="2.8" />
      <path d="M51 62 L51 138 C51 143 111 143 111 138 L111 62" opacity="0.45" strokeWidth="1.5" />
      <path d="M46 58 L51 58 M111 58 L116 58" strokeWidth="2.8" />
      <path d="M116 72 C154 66 154 128 116 124" strokeWidth="2.8" />
      <path d="M116 82 C140 80 140 116 116 114" opacity="0.6" strokeWidth="1.6" />
      <path d="M46 90 L116 90 M46 97 L116 97" opacity="0.5" strokeWidth="1.8" />
      <path d="M58 108 C60 124 62 132 66 138" opacity="0.4" strokeWidth="1.5" />
    </>
  ),
};

export function CupArt({ id }) {
  return ART[id] || null;
}

// A flattened latte-art heart that sits on the surface of an upright cup (drawn around 0,0).
export function LatteHeart() {
  return <path d="M0 3.6 C-17 -1 -15 -6 0 -2.2 C15 -6 17 -1 0 3.6 Z" fill="#F4EEE6" stroke="#C8955B" strokeWidth="0.8" />;
}
