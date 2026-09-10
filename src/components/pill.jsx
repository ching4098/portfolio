import { motion } from "framer-motion";
import { item } from "@/lib/motion";

export const Pill = ({ children }) => (
  <motion.span className="rounded-full border border-border px-2 py-0.5 text-xs tracking-wide" variants={item} layout>
    {children}
  </motion.span>
);
