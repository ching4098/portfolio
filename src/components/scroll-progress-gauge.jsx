import { motion, useScroll, useTransform } from "framer-motion";
import { ditherPattern } from "@/lib/dither-pattern";

const { cols, rows, cells } = ditherPattern;

export function ScrollProgressGauge({ dark = false }) {
  const { scrollYProgress } = useScroll();
  const clipHeight = useTransform(scrollYProgress, [0, 1], [rows, 0]);
  const clipY = useTransform(clipHeight, (h) => rows - h);

  const dim = dark ? "fill-steam/40" : "fill-mocha/35";
  const bright = dark ? "fill-milk" : "fill-espresso";

  return (
    <div className="fixed right-6 top-1/2 z-40 hidden w-11 -translate-y-1/2 sm:block" aria-hidden="true">
      <svg viewBox={`0 0 ${cols} ${rows}`} className="w-full">
        <g className={`${dim} transition-colors duration-500`}>
          {cells.map((cell, i) => (
            <rect key={i} x={cell.x} y={cell.y} width={1} height={1} />
          ))}
        </g>
        <clipPath id="gauge-fill-clip">
          <motion.rect x={0} width={cols} height={clipHeight} y={clipY} />
        </clipPath>
        <g className={`${bright} transition-colors duration-500`} clipPath="url(#gauge-fill-clip)">
          {cells.map((cell, i) => (
            <rect key={i} x={cell.x} y={cell.y} width={1} height={1} />
          ))}
        </g>
      </svg>
    </div>
  );
}
