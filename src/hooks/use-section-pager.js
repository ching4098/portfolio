import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];
const DURATION = 0.55;

// One wheel gesture, swipe or key press moves exactly one section.
// A section taller than the screen scrolls normally until its edge, then pages.
export function useSectionPager(ids, { reduceMotion } = {}) {
  const busy = useRef(false);
  const lastWheel = useRef(0);

  useEffect(() => {
    const html = document.documentElement;
    // Phones keep native snap scrolling, which already moves one section per swipe.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!coarse) html.style.scrollSnapType = "none";

    const sections = () => ids.map((id) => document.getElementById(id)).filter(Boolean);

    const currentIndex = () => {
      const list = sections();
      const y = window.scrollY + window.innerHeight * 0.35;
      let idx = 0;
      list.forEach((el, i) => {
        if (el.offsetTop <= y) idx = i;
      });
      return idx;
    };

    const goTo = (i) => {
      const list = sections();
      const target = list[Math.max(0, Math.min(list.length - 1, i))];
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY;
      if (Math.abs(top - window.scrollY) < 2) return;
      busy.current = true;
      if (reduceMotion) {
        window.scrollTo(0, top);
        setTimeout(() => (busy.current = false), 120);
        return;
      }
      animate(window.scrollY, top, {
        duration: DURATION,
        ease: EASE,
        onUpdate: (v) => window.scrollTo(0, v),
        onComplete: () => setTimeout(() => (busy.current = false), 90),
      });
    };

    // Inside a tall section: true when there is still room to scroll in that direction.
    const roomInside = (dir) => {
      const el = sections()[currentIndex()];
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      if (dir > 0) return rect.bottom > window.innerHeight + 4;
      return rect.top < -4;
    };

    const step = (dir) => {
      if (busy.current) return;
      if (roomInside(dir)) {
        window.scrollBy({ top: dir * window.innerHeight * 0.8, behavior: reduceMotion ? "auto" : "smooth" });
        busy.current = true;
        setTimeout(() => (busy.current = false), 380);
        return;
      }
      goTo(currentIndex() + dir);
    };

    const onWheel = (e) => {
      if (e.ctrlKey) return; // pinch zoom
      const el = e.target instanceof Element ? e.target.closest("[data-scroll-inside]") : null;
      if (el && el.scrollHeight > el.clientHeight) return;
      e.preventDefault();
      const now = performance.now();
      const gap = now - lastWheel.current;
      lastWheel.current = now;
      // Trackpads fire a long tail of inertia events; only a fresh gesture pages.
      if (busy.current || gap < 160) return;
      if (Math.abs(e.deltaY) < 4) return;
      step(e.deltaY > 0 ? 1 : -1);
    };

    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || document.activeElement?.isContentEditable) return;
      const down = ["ArrowDown", "PageDown"].includes(e.key) || (e.key === " " && !e.shiftKey);
      const up = ["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey);
      if (down || up) {
        e.preventDefault();
        step(down ? 1 : -1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(ids.length - 1);
      }
    };

    let touchY = null;
    const onTouchStart = (e) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchEnd = (e) => {
      if (touchY == null) return;
      const dy = touchY - e.changedTouches[0].clientY;
      touchY = null;
      if (Math.abs(dy) < 50) return;
      const dir = dy > 0 ? 1 : -1;
      if (roomInside(dir)) return; // let the phone scroll a long section natively
      goTo(currentIndex() + dir);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    if (!coarse) {
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
    }
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      html.style.scrollSnapType = "";
    };
  }, [ids, reduceMotion]);
}
