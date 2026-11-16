import { useCallback, useEffect, useRef } from "react";

const COVER_MS = 240;
const REVEAL_MS = 320;
const JAG = "polygon(0 4%, 8% 1%, 19% 5%, 31% 0, 44% 4%, 57% 1%, 70% 5%, 83% 0, 93% 3%, 100% 1%, 100% 100%, 0 100%)";
const JAG_UP = "polygon(0 0, 100% 0, 100% 99%, 92% 96%, 81% 100%, 68% 95%, 55% 99%, 42% 96%, 29% 100%, 17% 95%, 7% 99%, 0 96%)";

function getWipe() {
  let el = document.getElementById("brew-wipe");
  if (!el) {
    el = document.createElement("div");
    el.id = "brew-wipe";
    el.setAttribute("aria-hidden", "true");
    Object.assign(el.style, {
      position: "fixed",
      inset: "-4vh 0",
      zIndex: "58",
      pointerEvents: "none",
      transform: "translateY(110%)",
      willChange: "transform",
    });
    document.body.appendChild(el);
  }
  return el;
}

// One wheel gesture, swipe or key press moves exactly one section. The move is a
// milk wipe in the next section's colour: it covers the screen, the page jumps
// underneath while hidden, then the wipe pulls away. No half-scrolled frames.
export function useSectionPager(ids, { reduceMotion } = {}) {
  const busy = useRef(false);
  const lastWheel = useRef(0);

  const sections = useCallback(() => ids.map((id) => document.getElementById(id)).filter(Boolean), [ids]);

  const currentIndex = useCallback(() => {
    const y = window.scrollY + window.innerHeight * 0.4;
    let idx = 0;
    sections().forEach((el, i) => {
      if (el.offsetTop <= y) idx = i;
    });
    return idx;
  }, [sections]);

  const goTo = useCallback(
    (i) => {
      const list = sections();
      const from = currentIndex();
      const to = Math.max(0, Math.min(list.length - 1, i));
      const target = list[to];
      if (!target || busy.current) return;
      const top = target.offsetTop;
      if (Math.abs(top - window.scrollY) < 2) return;
      busy.current = true;
      if (reduceMotion) {
        window.scrollTo(0, top);
        window.dispatchEvent(new Event("pager:land"));
        setTimeout(() => (busy.current = false), 100);
        return;
      }
      const down = to > from || (to === from && top > window.scrollY);
      const wipe = getWipe();
      wipe.style.background = getComputedStyle(target).backgroundColor;
      wipe.style.clipPath = down ? JAG : JAG_UP;
      const start = down ? "translateY(110%)" : "translateY(-110%)";
      const end = down ? "translateY(-110%)" : "translateY(110%)";
      const cover = wipe.animate([{ transform: start }, { transform: "translateY(0)" }], {
        duration: COVER_MS,
        easing: "cubic-bezier(0.55, 0, 0.75, 0.3)",
        fill: "forwards",
      });
      cover.onfinish = () => {
        window.scrollTo(0, top);
        window.dispatchEvent(new Event("pager:land"));
        const reveal = wipe.animate([{ transform: "translateY(0)" }, { transform: end }], {
          duration: REVEAL_MS,
          easing: "cubic-bezier(0.2, 0.8, 0.3, 1)",
          fill: "forwards",
        });
        reveal.onfinish = () => {
          busy.current = false;
        };
      };
    },
    [sections, currentIndex, reduceMotion]
  );

  const goToId = useCallback((id) => goTo(ids.indexOf(id)), [goTo, ids]);

  useEffect(() => {
    const html = document.documentElement;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    // Phones keep native snap scrolling, which already lands one section per swipe.
    if (!coarse) html.style.scrollSnapType = "none";

    // Inside a section taller than the screen: room left to scroll in that direction?
    const roomInside = (dir) => {
      const el = sections()[currentIndex()];
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return dir > 0 ? rect.bottom > window.innerHeight + 4 : rect.top < -4;
    };

    const step = (dir) => {
      if (busy.current) return;
      if (roomInside(dir)) {
        // Step through a tall section in screen-sized moves that stop exactly on its edge.
        const rect = sections()[currentIndex()].getBoundingClientRect();
        const max = window.innerHeight * 0.85;
        const delta = dir > 0 ? Math.min(rect.bottom - window.innerHeight, max) : Math.max(rect.top, -max);
        busy.current = true;
        window.scrollBy({ top: delta, behavior: reduceMotion ? "auto" : "smooth" });
        setTimeout(() => (busy.current = false), 420);
        return;
      }
      goTo(currentIndex() + dir);
    };

    const onWheel = (e) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      const now = performance.now();
      const gap = now - lastWheel.current;
      lastWheel.current = now;
      // Trackpads keep firing inertia events; only a fresh gesture pages.
      if (busy.current || gap < 140 || Math.abs(e.deltaY) < 3) return;
      step(e.deltaY > 0 ? 1 : -1);
    };

    const onKey = (e) => {
      // A focused toy (the cup) may have used the key already.
      if (e.defaultPrevented) return;
      const a = document.activeElement;
      if (a && (["INPUT", "TEXTAREA", "SELECT"].includes(a.tagName) || a.isContentEditable)) return;
      let dir = 0;
      if (["ArrowDown", "PageDown"].includes(e.key) || (e.key === " " && !e.shiftKey)) dir = 1;
      if (["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey)) dir = -1;
      if (dir) {
        e.preventDefault();
        step(dir);
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        goTo(e.key === "Home" ? 0 : ids.length - 1);
      }
    };

    if (!coarse) window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      html.style.scrollSnapType = "";
    };
  }, [ids, reduceMotion, sections, currentIndex, goTo]);

  return goToId;
}
