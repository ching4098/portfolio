import { useState } from "react";

/* 08 · Take the recipe: the resume link pulls a quick extraction across itself on click. */
export function useExtraction() {
  const [extracting, setExtracting] = useState(false);
  const start = () => {
    setExtracting(true);
    setTimeout(() => setExtracting(false), 900);
  };
  return [extracting, start];
}
