import React, { useState, useEffect, useRef } from "react";
import { motion, MotionConfig, useScroll, useTransform, animate } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DitherMark } from "@/components/dither-mark";
import { ScrollProgressGauge } from "@/components/scroll-progress-gauge";
import { BackgroundShapes } from "@/components/background-shapes";
import { VerticalLabel } from "@/components/section-marks";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useDynamicFavicon } from "@/hooks/use-dynamic-favicon";
import aboutPhoto from "@/assets/about-photo.png";
import { Mail, Github, Linkedin, FileDown, School, BookOpen } from "lucide-react";
import resumePdf from "../public/Resume.pdf";

const EASE = [0.16, 1, 0.3, 1];

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

function useSectionProgress() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  return [ref, scrollYProgress];
}

const PROFILE = {
  name: "Zheng Xue (ZX) Ching",
  pronouns: "he/him",
  email: "chingzhengxue@gmail.com",
  links: {
    github: "https://github.com/ching4098",
    linkedin: "https://linkedin.com/in/zxching",
  },
  now: {
    title: "Software Engineer · Ad & Affiliate Technology @ Rakuten",
    period: "May 2026 – Present",
    bullets: [
      "Building backend services and microservice architecture for the Ad & Affiliate Technology platform.",
    ],
    footer: "Open to talk about more interesting research & work opportunities.",
  },
  experience: [
    {
      role: "Undergraduate Research Assistant",
      org: "MadAbility Lab @ UW–Madison",
      period: "Oct 2024 – Apr 2026",
      highlights: [
        "Worked on research I can't officially share yet ;)",
      ],
    },
    {
      role: "Undergraduate Research Assistant",
      org: "INTEGRATE @ UW–Madison",
      period: "May 2025 – Nov 2025",
      highlights: [
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
  whatIDo: [
    {
      title: "Backend & microservices",
      desc: "Designing and shipping backend services and microservice architecture — currently doing this daily on Rakuten's Ad & Affiliate Technology platform.",
    },
    {
      title: "Automation & QA",
      desc: "Cutting out repetitive manual work with automation and real test coverage, because tested code ships faster and breaks less often.",
    },
    {
      title: "Accessible, human-centered systems",
      desc: "Research-backed care for the people actually using what I build — shaped by VR-accessibility work published at CHI 2025.",
    },
  ],
  about:
    "When I'm not knee-deep in a microservice call graph, I'm probably overthinking a pour-over ratio. I got into specialty coffee around the same time I got into distributed systems, and I still can't tell if I'm optimizing for uptime or for extraction time. Professionally curious, unprofessionally caffeinated.",
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

const Pill = ({ children }) => (
  <motion.span className="rounded-full border border-border px-2 py-0.5 text-xs tracking-wide" variants={item} layout>
    {children}
  </motion.span>
);

function IntroOverlay() {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: "-100%" }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
      className="pointer-events-none fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-white"
    >
      <DitherMark variant="intro" className="h-24 w-20 text-black sm:h-32 sm:w-28" />
      <motion.div
        initial={{ letterSpacing: "0.6em", opacity: 0 }}
        animate={{ letterSpacing: "0.02em", opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
        className="font-display text-sm uppercase tracking-widest text-black"
      >
        ZX
      </motion.div>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        style={{ transformOrigin: "center" }}
        className="absolute bottom-8 left-8 right-8 h-px bg-black"
      />
    </motion.div>
  );
}

function NavLink({ href, idKey, children, currentKey, pulse, onClick, variant = "item" }) {
  const isActive = currentKey === idKey;
  const reduceMotion = usePrefersReducedMotion();
  const labelClass =
    variant === "brand"
      ? "font-display font-semibold tracking-tight text-ink hover:opacity-70"
      : `hover:opacity-70 ${isActive ? "font-medium" : ""}`;
  return (
    <a href={href} onClick={onClick} className="relative inline-flex items-center px-0.5">
      <span className={labelClass}>{children}</span>
      {isActive && (
        <>
          <motion.span
            layoutId="nav-underline"
            className="absolute left-0 right-0 -bottom-1 h-[2px] rounded bg-ink"
            transition={{ type: "spring", stiffness: 600, damping: 38 }}
          />
          {!reduceMotion && (
            <motion.span
              key={`echo-${idKey}-${pulse}`}
              className="absolute left-0 right-0 -bottom-1 h-[2px] rounded bg-ink/40"
              initial={{ scaleX: 1.8, opacity: 0.35, height: 3 }}
              animate={{ scaleX: 1, opacity: 0, height: 2 }}
              transition={{ duration: 0.5, ease: EASE }}
              style={{ transformOrigin: "center" }}
            />
          )}
        </>
      )}
    </a>
  );
}

const Section = ({ id, title, tone = "paper", wash, indent, labelledBy, children }) => {
  const isInk = tone === "ink";
  const hasVisibleTitle = Boolean(title && title.trim());
  const headingId = hasVisibleTitle ? `${id}-heading` : labelledBy;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`relative grid min-h-screen w-full snap-start items-center overflow-hidden ${isInk ? "dark bg-ink" : ""}`}
      style={
        isInk
          ? { backgroundImage: "var(--crema-wash)", "--wash-x": wash?.x, "--wash-y": wash?.y }
          : undefined
      }
    >
      <div
        className={`relative z-20 mx-auto max-w-5xl px-6 py-20 text-foreground sm:px-8 lg:max-w-6xl lg:py-32 xl:max-w-7xl xl:py-40 ${
          indent === "left" ? "lg:pr-16 xl:pr-28" : indent === "right" ? "lg:pl-16 xl:pl-28" : ""
        }`}
      >
        {hasVisibleTitle && (
          <p id={headingId} className="mb-6 font-display text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {title}
          </p>
        )}
        {children}
      </div>
    </section>
  );
};

const SECTION_TONES = {
  home: "ink",
  work: "paper",
  "what-i-do": "ink",
  projects: "paper",
  publication: "ink",
  education: "paper",
  skills: "ink",
  about: "paper",
  contact: "ink",
};

export default function App() {
  useDynamicFavicon();
  const reduceMotion = usePrefersReducedMotion();
  const [active, setActive] = useState("home");
  const [pulse, setPulse] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const activeTone = SECTION_TONES[active] ?? "paper";

  useEffect(() => {
    const ids = ["home", "work", "what-i-do", "projects", "publication", "education", "skills", "about", "contact"];
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

  useEffect(() => setPulse((p) => p + 1), [active]);
  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 900);
    return () => clearTimeout(t);
  }, []);

  const scrollToSection = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const targetY = el.getBoundingClientRect().top + window.scrollY;
    if (reduceMotion) {
      window.scrollTo(0, targetY);
      return;
    }
    const html = document.documentElement;
    html.style.scrollSnapType = "none";
    animate(window.scrollY, targetY, {
      duration: 0.5,
      ease: EASE,
      onUpdate: (v) => window.scrollTo(0, v),
      onComplete: () => {
        html.style.scrollSnapType = "";
      },
    });
  };

  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start end", "end start"] });
  const heroYRaw = useTransform(heroProgress, [0, 1], [0, -12]);
  const heroOpacityRaw = useTransform(heroProgress, [0, 1], [1, 0.95]);
  const heroY = reduceMotion ? 0 : heroYRaw;
  const heroOpacity = reduceMotion ? 1 : heroOpacityRaw;

  const [workRef, workProgress] = useSectionProgress();
  const [doRef, doProgress] = useSectionProgress();

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
      ok(typeof resumePdf === "string" && resumePdf.includes("Resume"), "Resume PDF import invalid");
      console.log("[Portfolio: dev smoke tests] ✅ passed");
    } catch (e) {
      console.warn("[Portfolio: dev smoke tests] ⚠️", e);
    }
  }, [pulse]);

  const navItems = [
    { id: "work", label: "Work" },
    { id: "what-i-do", label: "What I Do" },
    { id: "projects", label: "Projects" },
    { id: "publication", label: "Publication" },
    { id: "education", label: "Education" },
    { id: "skills", label: "Skills" },
    { id: "about", label: "About" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <MotionConfig transition={{ type: "spring", bounce: 0.2 }}>
      <div className="min-h-screen bg-background font-sans text-foreground">
        {showIntro && !reduceMotion && <IntroOverlay />}
        <ScrollProgressGauge tone={activeTone} />
        <BackgroundShapes active={active} tone={activeTone} />

        <header className="sticky top-0 z-30 border-b border-mist bg-paper/90 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
            <NavLink href="#home" idKey="home" currentKey={active} pulse={pulse} onClick={scrollToSection("home")} variant="brand">
              ZX Ching
            </NavLink>
            <div className="hidden lg:flex gap-5 text-sm text-ink">
              {navItems.map(({ id, label }) => (
                <NavLink key={id} href={`#${id}`} idKey={id} currentKey={active} pulse={pulse} onClick={scrollToSection(id)}>
                  {label}
                </NavLink>
              ))}
            </div>
            <Button asChild size="sm">
              <a href={resumePdf} target="_blank" rel="noreferrer">
                <FileDown className="h-4 w-4 mr-2" />
                Resume
              </a>
            </Button>
          </nav>
        </header>

        <Section id="home" tone="ink" wash={{ x: "80%", y: "10%" }} labelledBy="home-heading">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-16 select-none font-display text-[9rem] font-extrabold leading-none text-paper/15 sm:text-[13rem]"
            style={{ transform: "rotate(8deg)" }}
          >
            01
          </div>

          <motion.div ref={heroRef} style={{ y: heroY, opacity: heroOpacity }} layout className="relative">
            <div className="grid items-start gap-10 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_340px] xl:grid-cols-[1.2fr_380px]">
              <div>
                <p className="uppercase tracking-widest text-[10px] font-display text-muted-foreground mb-3">PORTFOLIO</p>
                <h1 id="home-heading" className="font-display text-3xl font-extrabold leading-[1.15] sm:text-4xl lg:text-5xl">
                  Currently a coffee-craved software engineer in his 20s navigating one complex microservice
                  architecture at a time.
                </h1>

                <div className="mt-7 flex flex-wrap gap-3">
                  <motion.div layout>
                    <Button asChild>
                      <a href={`mailto:${PROFILE.email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </a>
                    </Button>
                  </motion.div>
                  <motion.div layout>
                    <Button
                      asChild
                      variant="outline"
                      className="border-foreground text-foreground hover:bg-foreground hover:text-background"
                    >
                      <a href={PROFILE.links.github} target="_blank" rel="noreferrer">
                        <Github className="h-4 w-4 mr-2" />
                        GitHub
                      </a>
                    </Button>
                  </motion.div>
                  <motion.div layout>
                    <Button
                      asChild
                      variant="outline"
                      className="border-foreground text-foreground hover:bg-foreground hover:text-background"
                    >
                      <a href={PROFILE.links.linkedin} target="_blank" rel="noreferrer">
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  </motion.div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">{PROFILE.pronouns}</span>
                </div>
              </div>

              <div className="lg:-ml-6 lg:mt-10">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base tracking-tight">Now</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm font-medium">{PROFILE.now.title}</div>
                    <div className="text-xs text-muted-foreground">{PROFILE.now.period}</div>
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
                  <CardFooter className="text-xs text-muted-foreground">{PROFILE.now.footer}</CardFooter>
                </Card>
              </div>
            </div>
          </motion.div>
        </Section>

        <Section id="work" title="Experience" indent="left">
          <VerticalLabel progress={workProgress} className="left-0 top-1/2 hidden -translate-y-1/2 text-ink/20 lg:block">
            Experience
          </VerticalLabel>
          <motion.div
            ref={workRef}
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-6"
          >
            {PROFILE.experience.map((job, idx) => (
              <motion.div key={idx} variants={item} layout>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1 text-lg">
                      <span>{job.role}</span>
                      <span className="text-muted-foreground">@ {job.org}</span>
                      <span className="ml-auto text-sm text-muted-foreground">{job.period}</span>
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
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        <Section id="what-i-do" title="What I Do" tone="ink" wash={{ x: "15%", y: "15%" }}>
          <VerticalLabel progress={doProgress} className="left-0 top-1/2 hidden -translate-y-1/2 text-paper/25 lg:block">
            What I Do
          </VerticalLabel>
          <div ref={doRef} className="grid gap-6 sm:grid-cols-3">
            {PROFILE.whatIDo.map((doItem, i) => (
              <motion.div
                key={doItem.title}
                variants={item}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="font-display text-2xl text-paper/40">{String(i + 1).padStart(2, "0")}</div>
                    <CardTitle className="text-base">{doItem.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{doItem.desc}</CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section id="projects" title="Projects">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-6 lg:ml-[18%] lg:max-w-[68%]"
          >
            {PROFILE.projects.map((p, i) => (
              <motion.div key={i} variants={item} layout>
                <Card className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{p.blurb}</p>
                    <motion.div className="mt-3 flex flex-wrap gap-2" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                      {p.tech.map((t) => (
                        <Pill key={t}>{t}</Pill>
                      ))}
                    </motion.div>
                    {p.details && (
                      <motion.ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                        {p.details.map((d, idx2) => (
                          <motion.li key={idx2} variants={item}>
                            {d}
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        <Section id="publication" title="Publication" tone="ink" wash={{ x: "85%", y: "50%" }}>
          <Reveal>
            <Card>
              <CardContent className="py-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                  <BookOpen className="h-5 w-5 mb-3 sm:mb-0" />
                  <div className="space-y-1">
                    <div className="text-sm font-medium sm:text-base">{PROFILE.publication.title}</div>
                    <div className="text-sm text-muted-foreground">{PROFILE.publication.authors}</div>
                    <div className="pt-1">
                      <a className="text-sm underline underline-offset-4" href={PROFILE.publication.link} target="_blank" rel="noreferrer">
                        Read the DOI
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </Section>

        <Section id="education" title="Education" indent="right">
          <Reveal>
            <div style={{ transform: "rotate(-1.5deg)" }}>
              <Card>
                <CardContent className="py-6" style={{ transform: "rotate(1.5deg)" }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <School className="h-5 w-5 mb-3 sm:mb-0" />
                    <div>
                      <div className="font-medium">
                        {PROFILE.education.school} — {PROFILE.education.degree}
                      </div>
                      <div className="text-sm text-muted-foreground">{PROFILE.education.period}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Reveal>
        </Section>

        <Section id="skills" title="Skills" tone="ink" wash={{ x: "15%", y: "85%" }}>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <Reveal>
              <Card className="md:col-span-2">
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
            </Reveal>

            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-4">
              {PROFILE.values.map((v) => (
                <motion.div key={v.name} variants={item} layout>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{v.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{v.desc}</CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </Section>

        <Section id="about" title="About Me">
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
            <div className="shrink-0 border border-mist p-1" style={{ transform: "rotate(1.5deg)" }}>
              <img src={aboutPhoto} alt={`${PROFILE.name} outdoors`} className="h-40 w-40 object-cover sm:h-48 sm:w-48" />
            </div>
            <p className="font-accent text-lg leading-relaxed sm:text-xl">{PROFILE.about}</p>
          </div>
        </Section>

        <Section id="contact" tone="ink" wash={{ x: "85%", y: "90%" }} labelledBy="contact-heading">
          <div className="relative">
            <p className="mb-3 font-display text-[10px] uppercase tracking-widest text-muted-foreground">CONTACT</p>
            <h2 id="contact-heading" className="max-w-xl font-display text-3xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Always open for the next pour.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">{PROFILE.now.footer}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="bg-white text-black hover:bg-white/90">
                <a href={`mailto:${PROFILE.email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </a>
              </Button>
              <Button asChild variant="outline" className="border-foreground text-foreground hover:bg-foreground hover:text-background">
                <a href={PROFILE.links.github} target="_blank" rel="noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              </Button>
              <Button asChild variant="outline" className="border-foreground text-foreground hover:bg-foreground hover:text-background">
                <a href={PROFILE.links.linkedin} target="_blank" rel="noreferrer">
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
            </div>
          </div>
        </Section>

        <footer className="border-t border-border">
          <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
            <span>© {new Date().getFullYear()} ZX Ching</span>
            <span>Built with React · Tailwind · shadcn/ui</span>
          </div>
        </footer>
      </div>
      <Analytics />
    </MotionConfig>
  );
}
