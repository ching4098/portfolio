import { motion } from "framer-motion";
import { item } from "@/lib/motion";

export const Pill = ({ children }) => (
  <motion.span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] tracking-wide" variants={item} layout>
    {children}
  </motion.span>
);
