import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  MotionConfig,
  useScroll,
  useTransform,
  animate,
  useMotionValue,
} from "framer-motion";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Github,
  Linkedin,
  FileDown,
  MapPin,
  School,
  BookOpen,
  Phone,
} from "lucide-react";

// ----- constants / helpers -----
const EASE = [0.16, 1, 0.3, 1];

// dev-friendly reveal wrapper
const Reveal = ({ delay = 0, y = 10, children }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2, margin: "-5%" }}
    transition={{ duration: 0.45, delay, ease: EASE }}
  >
    {children}
  </motion.div>
);

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } } };

// ----- content (from resume) -----
const PROFILE = {
  name: "Zheng Xue (ZX) Ching",
  phone: "+1 (608) 217-7160",
  tagline: "I build fast, kind systems — performance, automation, accessibility.",
  location: "Madison, WI",
  pronouns: "he/him",
  email: "chingzhengxue@gmail.com",
  links: {
    github: "https://github.com/ching4098",
    linkedin: "https://linkedin.com/in/zxching",
  },
  now:     
  {
      role: "Undergraduate Research Assistant",
      org: "MadAbility Lab @ UW–Madison",
      period: "Oct 2024 – Present · Madison, WI",
      highlights: [
        "Advanced data annotation for VR datasets to support model training.",
        "Developed functions to query ML models and streamline analysis.",
        "Integrated ChatGPT API into research tooling for responsive workflows.",
        "Parallelized computational functions for high-volume data handling.",
      ],
  },
  experience: [
    {
    title: "Undergraduate Research Assistant · INTEGRATE @ UW–Madison",
    period: "May 2025 – Present",
    bullets: [
      "Designed pipelines to capture & process study data; saved ~6.5 hours of manual work.",
      "Wrote Python sims to run 12 study runs/user; validated pseudo-random task assignment.",
      "Reduced selection bias by ≥85%; co-designed study scope & interactions.",
      "Defined VR interaction flows; pilot runs saw ~20% fewer usability issues.",
    ],
    },
    {
      role: "Software Engineer Intern",
      org: "Nixma Technologies",
      period: "Jun 2024 – Aug 2024",
      highlights: [
        "Improved legacy code performance by ~40% with refactors.",
        "Cut manual testing time by ~30% and increased accuracy ~20% via automation.",
        "Added multithreading: throughput ↑ ~25%, reliability ↑ ~15%.",
        "Built HMIs with multi-user access control; reduced operator faults ~20%.",
      ],
    },
  ],
  projects: [
    {
      title: "Prim’s & Dijkstra’s Visualizer",
      tech: ["Java", "JUnit", "JavaFX"],
      blurb: "MST & shortest-path visualizer with adjacency lists and min-heap priority queues.",
      details: [
        "Time complexity optimized to O(E log V) using min-heap PQs.",
        "Lazy deletion + data-structure reuse reduce overhead.",
        "GUI to input graphs and watch step-by-step execution.",
        "Demonstrated with real-world datasets (routing, shortest-path).",
      ],
    },
  ],
  education: {
    school: "University of Wisconsin–Madison",
    degree: "B.S. in Computer Science",
    period: "Sep 2023 – Dec 2025",
    location: "Madison, WI",
  },
  publication: {
    title:
      "Demonstration of VRSight: AI-Driven Real-Time Descriptions to Enhance VR Accessibility for Blind People (CHI 2025)",
    link: "https://doi.org/10.1145/3706599.3721194",
    authors:
      "Daniel Killough, Justin Feng, Rithvik Dyava, Zheng Xue ‘ZX’ Ching, Daniel Wang, Yapeng Tian, Yuhang Zhao",
  },
  skills: [
    "Java",
    "C#",
    "C/C++",
    "SQL",
    "MySQL",
    "Python",
    "JavaScript",
    "HTML/CSS",
    "Software QA & Testing",
    "Automation",
    "Data Handling & Processing",
  ],
  values: [
    { name: "Craft", desc: "Readable, tested code ships faster." },
    { name: "Accessibility", desc: "Build for everyone by default." },
    { name: "Curiosity", desc: "Learn in public; iterate quickly." },
  ],
};

// import the PDF from src/assets (matches your folder)
import resumePdf from "../public/Resume.pdf";

// ----- small building blocks -----
const Pill = ({ children }) => (
  <motion.span
    className="rounded-full border border-neutral-300 px-2 py-0.5 text-xs tracking-wide"
    variants={item}
    whileHover={{ y: -1 }}
    transition={{ duration: 0.2, ease: EASE }}
    layout
  >
    {children}
  </motion.span>
);

function IntroOverlay() {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: "-100%" }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
      className="fixed inset-0 z-[60] bg-white flex items-center justify-center pointer-events-none"
    >
      <motion.div
        initial={{ letterSpacing: "0.6em", opacity: 0 }}
        animate={{ letterSpacing: "0.02em", opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="text-sm tracking-widest font-medium text-neutral-900 uppercase"
      >
        ZX
      </motion.div>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        style={{ transformOrigin: "center" }}
        className="absolute bottom-8 left-8 right-8 h-px bg-neutral-900"
      />
    </motion.div>
  );
}

function NavLink({ href, idKey, children, currentKey, hoveredKey, pulse }) {
  const isActive = currentKey === idKey;
  const isHover = hoveredKey === idKey;
  return (
    <a href={href} className="relative inline-flex items-center px-0.5">
      <span className={`hover:opacity-70 ${isActive ? "font-medium" : ""}`}>{children}</span>
      {isActive && (
        <>
          <motion.span
            layoutId="nav-underline"
            className="absolute left-0 right-0 -bottom-1 bg-neutral-900 rounded"
            style={{ height: isHover ? 3 : 2 }}
            transition={{ type: "spring", stiffness: 600, damping: 38 }}
          />
          <motion.span
            key={`echo-${idKey}-${pulse}`}
            className="absolute left-0 right-0 -bottom-1 bg-neutral-900/40 rounded"
            initial={{ scaleX: 1.8, opacity: 0.35, height: isHover ? 4 : 3 }}
            animate={{ scaleX: 1, opacity: 0, height: 2 }}
            transition={{ duration: 0.5, ease: EASE }}
            style={{ transformOrigin: "center" }}
          />
        </>
      )}
    </a>
  );
}

const Section = ({ id, title, children }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 20%"] });
  const bar = useTransform(scrollYProgress, [0, 1], [0.15, 1]);
  return (
    <section ref={ref} id={id} className="max-w-5xl mx-auto px-6 sm:px-8 py-12">
      {title && title.trim() && (
        <div className="mb-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>
          </div>
          <motion.div style={{ scaleX: bar }} className="h-[2px] bg-neutral-900 origin-left" />
        </div>
      )}
      {children}
    </section>
  );
};

function CountUp({ to = 100, duration = 1.2, suffix = "" }) {
  const mv = useMotionValue(0);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const controls = animate(mv, to, { duration, ease: EASE });
    const unsub = mv.on("change", (v) => setVal(Math.round(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [to, duration]);
  return (
    <span>
      {val}
      {suffix}
    </span>
  );
}

function MarqueeStrip() {
  const phrase =
    "Build fast • Automate the boring stuff • Design for everyone • Sweat the details • Ship, learn, iterate";
  return (
    <div className="overflow-hidden border-b border-neutral-200">
      <motion.div
        aria-hidden
        className="flex whitespace-nowrap py-2 text-[11px] sm:text-[12px] tracking-widest uppercase text-neutral-700"
        initial={{ x: 0 }}
        animate={{ x: "-50%" }}
        transition={{ repeat: Infinity, repeatType: "loop", duration: 28, ease: "linear" }}
      >
        <span className="mx-6">{phrase}</span>
        <span className="mx-6">{phrase}</span>
        <span className="mx-6">{phrase}</span>
        <span className="mx-6">{phrase}</span>
      </motion.div>
    </div>
  );
}

// ----- main app -----
export default function App() {
  const [hovered, setHovered] = useState(null);
  const [active, setActive] = useState("work");
  const [pulse, setPulse] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const ids = ["work", "projects", "publication", "education", "skills", "contact"];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const currentKey = hovered ?? active;
  useEffect(() => setPulse((p) => p + 1), [currentKey]);
  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 900);
    return () => clearTimeout(t);
  }, []);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start end", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -12]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  // -------- dev-only smoke tests (keep!) --------
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ok = (cond, msg) => {
        if (!cond) throw new Error(msg);
      };
      ok(typeof PROFILE.name === "string" && PROFILE.name.length > 0, "PROFILE.name missing");
      ok(typeof PROFILE.email === "string" && PROFILE.email.includes("@"), "PROFILE.email invalid");
      ok(Array.isArray(PROFILE.projects) && PROFILE.projects.length >= 1, "Projects array empty");
      ok(PROFILE.education && PROFILE.education.school.includes("Wisconsin"), "Education not populated");
      const employers = PROFILE.experience.map((e) => e.org).join(" ");
      ok(/INTEGRATE|MadAbility|Nixma/.test(employers), "Experience orgs incomplete");
      // resume import sanity
      ok(typeof resumePdf === "string" && resumePdf.includes("Resume"), "Resume PDF import invalid");
      // CountUp exists
      ok(typeof CountUp === "function", "CountUp component not defined");
      console.log("[Portfolio: dev smoke tests] ✅ passed");
    } catch (e) {
      console.warn("[Portfolio: dev smoke tests] ⚠️", e);
    }
  }, [pulse]);

  return (
    <MotionConfig transition={{ type: "spring", bounce: 0.2 }}>
      <div className="min-h-screen bg-white text-neutral-900 scroll-smooth">
        {showIntro && <IntroOverlay />}

        {/* NAV */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-neutral-200">
          <nav className="max-w-5xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
            <a href="#home" className="font-semibold tracking-tight">
              ZX Ching
            </a>
            <div className="hidden sm:flex gap-6 text-sm" onMouseLeave={() => setHovered(null)}>
              {["work", "projects", "publication", "education", "skills", "contact"].map((k) => (
                <div key={k} onMouseEnter={() => setHovered(k)} onFocus={() => setHovered(k)} onBlur={() => setHovered(null)}>
                  <NavLink href={`#${k}`} idKey={k} currentKey={currentKey} hoveredKey={hovered} pulse={pulse}>
                    {k[0].toUpperCase() + k.slice(1)}
                  </NavLink>
                </div>
              ))}
            </div>
            <motion.div whileHover={{ y: -1 }} layout>
              <Button asChild size="sm" className="rounded-full bg-black text-white hover:bg-neutral-800">
                <a href={resumePdf} target="_blank" rel="noreferrer">
                  <FileDown className="h-4 w-4 mr-2" />
                  Resume
                </a>
              </Button>
            </motion.div>
          </nav>
          <MarqueeStrip />
        </header>

        {/* HERO */}
        <Section id="home" title={" "}>
          <motion.div ref={heroRef} style={{ y: heroY, opacity: heroOpacity }} layout>
            <div className="grid md:grid-cols-[1fr,300px] gap-10 items-start">
              <div>
                <p className="uppercase tracking-widest text-[10px] text-neutral-500 mb-3">PORTFOLIO</p>
                <h1 className="text-4xl sm:text-6xl font-semibold leading-[1.05]">
                  I build <span className="underline underline-offset-4">fast</span>,
                  <br className="hidden sm:block" /> kind systems.
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-neutral-600 max-w-2xl">{PROFILE.tagline}</p>

                {/* counters */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div>
                    <div className="text-2xl sm:text-3xl font-semibold">
                      <CountUp to={85} suffix="%" />
                    </div>
                    <div className="text-xs text-neutral-500">bias reduction (sims)</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-semibold">
                      <CountUp to={40} suffix="%" />
                    </div>
                    <div className="text-xs text-neutral-500">legacy perf improvement</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-semibold">
                      <CountUp to={25} suffix="%" />
                    </div>
                    <div className="text-xs text-neutral-500">throughput increase</div>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <motion.div whileHover={{ y: -1 }} layout>
                    <Button asChild className="rounded-full bg-black text-white hover:bg-neutral-800">
                      <a href={`mailto:${PROFILE.email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </a>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ y: -1 }} layout>
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-full border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white"
                    >
                      <a href={PROFILE.links.github} target="_blank" rel="noreferrer">
                        <Github className="h-4 w-4 mr-2" />
                        GitHub
                      </a>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ y: -1 }} layout>
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-full border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white"
                    >
                      <a href={PROFILE.links.linkedin} target="_blank" rel="noreferrer">
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  </motion.div>
                  <motion.div className="inline-flex items-center gap-2 text-sm text-neutral-700" layout>
                    <Phone className="h-4 w-4" /> {PROFILE.phone}
                  </motion.div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {PROFILE.location}
                  </span>
                  <span className="inline-flex items-center gap-2">•</span>
                  <span className="inline-flex items-center gap-2">{PROFILE.pronouns}</span>
                </div>
              </div>

              <motion.div layout>
                <Card className="rounded-2xl border-neutral-200">
                  <CardHeader>
                    <CardTitle className="text-base tracking-tight">Now</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm font-medium">{PROFILE.now.title}</div>
                    <div className="text-xs text-neutral-500">{PROFILE.now.period}</div>
                    <motion.ul
                      className="mt-2 space-y-2 text-sm list-disc pl-5"
                      variants={stagger}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true }}
                    >
                      {PROFILE.now.bullets.map((b, i) => (
                        <motion.li key={i} variants={item}>
                          {b}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </CardContent>
                  <CardFooter className="text-xs text-neutral-500">Open to challenging internships & collaborations.</CardFooter>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </Section>

        {/* EXPERIENCE */}
        <Section id="work" title="Experience">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid gap-6">
            {PROFILE.experience.map((job, idx) => (
              <motion.div key={idx} variants={item} whileHover={{ y: -3 }} transition={{ duration: 0.25, ease: EASE }} layout>
                <Card className="group rounded-2xl border-neutral-200 overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1 text-lg">
                      <span>{job.role}</span>
                      <span className="text-neutral-500">@ {job.org}</span>
                      <span className="ml-auto text-sm text-neutral-500">{job.period}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.ul className="space-y-2 list-disc pl-5 text-sm" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                      {job.highlights.map((h, i) => (
                        <motion.li key={i} variants={item}>
                          {h}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </CardContent>
                  <motion.div className="h-[2px] bg-neutral-900 origin-left" initial={{ scaleX: 0 }} whileHover={{ scaleX: 1 }} transition={{ duration: 0.35, ease: EASE }} />
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        {/* PROJECTS */}
        <Section id="projects" title="Projects">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid sm:grid-cols-2 gap-6">
            {PROFILE.projects.map((p, i) => (
              <motion.div key={i} variants={item} whileHover={{ y: -3 }} transition={{ duration: 0.25, ease: EASE }} className="h-full flex flex-col" layout>
                <Card className="group h-full flex flex-col rounded-2xl border-neutral-200 overflow-hidden relative">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="grow">
                    <p className="text-sm text-neutral-600">{p.blurb}</p>
                    <motion.div className="mt-3 flex flex-wrap gap-2" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                      {p.tech.map((t) => (
                        <Pill key={t}>{t}</Pill>
                      ))}
                    </motion.div>
                    {p.details && (
                      <motion.ul className="mt-3 list-disc pl-5 text-sm text-neutral-700" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                        {p.details.map((d, idx2) => (
                          <motion.li key={idx2} variants={item}>
                            {d}
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </CardContent>
                  <motion.div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900 origin-left" initial={{ scaleX: 0 }} whileHover={{ scaleX: 1 }} transition={{ duration: 0.35, ease: EASE }} />
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        {/* PUBLICATION */}
        <Section id="publication" title="Publication">
          <Reveal>
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: EASE }} layout>
              <Card className="rounded-2xl border-neutral-200">
                <CardContent className="py-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <BookOpen className="h-5 w-5 mb-3 sm:mb-0" />
                    <div className="space-y-1">
                      <div className="font-medium">{PROFILE.publication.title}</div>
                      <div className="text-sm text-neutral-600">{PROFILE.publication.authors}</div>
                      <div className="pt-1">
                        <motion.a
                          whileHover={{ y: -1 }}
                          className="text-sm underline underline-offset-4 hover:opacity-70"
                          href={PROFILE.publication.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Read the DOI
                        </motion.a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Reveal>
        </Section>

        {/* EDUCATION */}
        <Section id="education" title="Education">
          <Reveal>
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: EASE }} layout>
              <Card className="rounded-2xl border-neutral-200">
                <CardContent className="py-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <School className="h-5 w-5 mb-3 sm:mb-0" />
                    <div>
                      <div className="font-medium">
                        {PROFILE.education.school} — {PROFILE.education.degree}
                      </div>
                      <div className="text-sm text-neutral-600">{PROFILE.education.period}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Reveal>
        </Section>

        {/* SKILLS */}
        <Section id="skills" title="Skills">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <Reveal>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: EASE }} layout>
                <Card className="md:col-span-2 rounded-2xl border-neutral-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Technical</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div className="flex flex-wrap gap-2" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                      {PROFILE.skills.map((s) => (
                        <Pill key={s}>{s}</Pill>
                      ))}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </Reveal>

            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-4">
              {PROFILE.values.map((v) => (
                <motion.div key={v.name} variants={item} whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: EASE }} layout>
                  <Card className="rounded-2xl border-neutral-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{v.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-neutral-600">{v.desc}</CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </Section>

        {/* FOOTER */}
        <footer className="border-t border-neutral-200">
          <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8 text-xs text-neutral-500 flex flex-wrap items-center justify-between gap-3">
            <span>© {new Date().getFullYear()} ZX Ching</span>
            <span>Built with React · Tailwind · shadcn/ui</span>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
