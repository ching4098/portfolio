import { motion } from "framer-motion";
import paperTitle from "@/assets/paper-title.png";
import paperFig1 from "@/assets/paper-fig1.png";
import paperFig3 from "@/assets/paper-fig3.png";

const cascade = { hidden: {}, show: { transition: { staggerChildren: 0.15 } } };
const cascadeItem = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } };

const PAGES = [
  { src: paperTitle, alt: "VRSight paper title and authors", rotate: -4, w: "w-32 sm:w-40" },
  { src: paperFig1, alt: "VRSight pipeline: detection, depth, and spatial audio stages", rotate: 3, w: "w-48 sm:w-60" },
  { src: paperFig3, alt: "VRSight technical system flowchart", rotate: -3, w: "w-40 sm:w-48" },
];

export function PaperShowcase() {
  return (
    <motion.div
      variants={cascade}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="flex flex-wrap items-end"
    >
      {PAGES.map((p, i) => (
        <motion.div
          key={i}
          variants={cascadeItem}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ rotate: p.rotate }}
          className={`${i > 0 ? "-ml-6" : ""} shrink-0 border border-mist bg-paper p-1`}
        >
          <img src={p.src} alt={p.alt} className={`${p.w} object-cover`} />
        </motion.div>
      ))}
    </motion.div>
  );
}
