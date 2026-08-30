import { useEffect, useRef } from "react";
import { useScroll } from "framer-motion";
import { ditherPattern } from "@/lib/dither-pattern";

const { cols, rows, cells } = ditherPattern;
const SIZE = 32;
const THROTTLE_MS = 150;

export function useDynamicFavicon() {
  const { scrollYProgress } = useScroll();
  const lastDraw = useRef(0);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let currentLink = document.querySelector('link[rel="icon"]');

    const cellW = SIZE / cols;
    const cellH = SIZE / rows;

    function draw(progress) {
      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(0, 0, SIZE, SIZE);
      const fillLine = rows - progress * rows;
      ctx.fillStyle = "#FAFAFA";
      for (const cell of cells) {
        if (cell.y >= fillLine) {
          ctx.fillRect(cell.x * cellW, cell.y * cellH, Math.ceil(cellW), Math.ceil(cellH));
        }
      }
      const newLink = document.createElement("link");
      newLink.rel = "icon";
      newLink.type = "image/png";
      newLink.href = canvas.toDataURL("image/png");
      document.head.appendChild(newLink);
      if (currentLink?.parentNode) currentLink.parentNode.removeChild(currentLink);
      currentLink = newLink;
    }

    draw(scrollYProgress.get());
    const unsub = scrollYProgress.on("change", (p) => {
      const now = performance.now();
      if (now - lastDraw.current < THROTTLE_MS) return;
      lastDraw.current = now;
      draw(p);
    });
    return unsub;
  }, [scrollYProgress]);
}
