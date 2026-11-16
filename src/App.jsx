import React, { useState, useEffect, useRef } from "react";
import { motion, MotionConfig, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DitherMark } from "@/components/dither-mark";
import { ScrollProgressGauge } from "@/components/scroll-progress-gauge";
import { BackgroundShapes, SteamShape } from "@/components/background-shapes";
import { VerticalLabel } from "@/components/section-marks";
import { PaperShowcase } from "@/components/paper-showcase";
import { AlgorithmRace } from "@/components/algorithm-race";
import { GithubRepos } from "@/components/github-repos";
import { Pill } from "@/components/pill";
import { EASE, stagger, item } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useDynamicFavicon } from "@/hooks/use-dynamic-favicon";
import aboutPhoto from "@/assets/about-photo.png";
import { Mail, Github, Linkedin, FileDown, School, BookOpen, Menu, X } from "lucide-react";
import resumePdf from "../public/Resume.pdf";
import { CoffeeRing, Tape, HandArrow, HandNote, SlantEdge, OutlineNumber, StepTag } from "@/components/brew/doodles";
import { GROUNDS, SECTION_ORDER, groundOf, nextGroundOf, groundVars } from "@/lib/grounds";
import {
  ShotIntro,
  PourStream,
  LatteRipple,
  SteamTrail,
  CremaCup,
  FoamBubbles,
  EmptyCup,
} from "@/components/brew/motion-layer";
import { CoffeeToys } from "@/components/brew/coffee-cup";
import { useExtraction } from "@/hooks/use-extraction";
import { useSectionPager } from "@/hooks/use-section-pager";
import { installAvoid } from "@/lib/avoid";

const PAGER_IDS = ["home", "work", "what-i-do", "projects", "publication", "education", "skills", "about", "contact"];

const Reveal = ({ delay = 0, y = 10, children }) => {
  const reduceMotion = usePrefersReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: "-5%" }}
      transition={{ duration: 0.45, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

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
    title: "Software Engineer @ Rakuten",
    period: "May 2026 - Present",
    footer: "Open to talk about more interesting research & work opportunities.",
  },
  contactNote: "Reach out about research, open roles, or engineering work.",
  experience: [
    {
      role: "Software Engineer",
      org: "Rakuten",
      period: "May 2026 - Present",
      summary:
        "Helping merge three affiliate platforms, Rakuten Affiliate, LinkShare and TrafficGate, into one. I love the unglamorous parts: making a 6-second page load in 0.3, and finding where events go when nobody's watching. I also run a small crew of Claude Code agents that debug alongside me.",
    },
    {
      role: "Undergraduate Research Assistant",
      org: "MadAbility Lab @ UW-Madison",
      period: "Oct 2024 - Apr 2026",
      summary:
        "Worked on VRSight, an AI system that describes VR worlds out loud so blind users can explore them. I built the data and backend side: model training data, faster queries, real-time speech through Azure. We demoed it at CHI 2025.",
    },
    {
      role: "Undergraduate Research Assistant",
      org: "INTEGRATE @ UW-Madison",
      period: "May 2025 - Nov 2025",
      summary:
        "Built the plumbing for a VR user study. Pipelines turned messy logs into clean data, and a simulator kept every participant's task order fair.",
    },
    {
      role: "Software Engineer Intern",
      org: "Nixma Technologies",
      period: "Jun 2024 - Aug 2024",
      summary: "My first taste of production. Made industrial automation software faster, safer and properly tested.",
    },
  ],
  whatIDo: [
    {
      title: "Backend that holds up",
      desc: "Services and pipelines that stay fast when the data gets big.",
    },
    {
      title: "Building with AI agents",
      desc: "I treat Claude Code like a team and spend my time on the hard calls.",
    },
    {
      title: "Accessible by default",
      desc: "VRSight taught me to build for people who aren't the typical user.",
    },
  ],
  about:
    "When I'm not knee-deep in a microservice call graph, I'm probably hunting for a new coffee shop worth the detour. I got into specialty coffee around the same time I got into distributed systems, and I still can't tell if I'm optimizing for uptime or for the perfect cafe. Professionally curious, unprofessionally caffeinated.",
  coffeeOrders: ["Latte", "Cappuccino", "Flat White"],
  coffeeNote:
    "Terrible at latte art, but great at finding a cafe with the right vibe. I'll happily go the extra mile for one that gets it exactly right.",
  projects: [
    {
      title: "adperf",
      status: "In progress",
      tech: ["Python", "DuckDB"],
      blurb:
        "For anyone who's ever reconciled two ad dashboards by hand and lost an afternoon. Python, DuckDB and millions of rows of public ad data. More soon.",
    },
    {
      title: "Fraud Detection · Capital One Capstone",
      tech: ["Python", "AWS Lambda", "DynamoDB"],
      blurb: "Serverless pipeline that flags risky transactions in under 200ms.",
    },
    {
      title: "Prim’s & Dijkstra’s Visualizer",
      tech: ["Java", "JavaFX"],
      blurb: "Watch MST and shortest-path algorithms work through a graph, step by step.",
    },
  ],
  education: {
    school: "University of Wisconsin-Madison",
    degree: "B.S. in Computer Science",
    period: "Sep 2023 - Dec 2025",
    location: "Madison, WI",
  },
  publication: {
    title:
      "Demonstration of VRSight: AI-Driven Real-Time Descriptions to Enhance VR Accessibility for Blind People (CHI 2025)",
    link: "https://doi.org/10.1145/3706599.3721194",
    authors:
      "Daniel Killough, Justin Feng, Rithvik Dyava, Zheng Xue ‘ZX’ Ching, Daniel Wang, Yapeng Tian, Yuhang Zhao",
    summary:
      "VRSight lets blind and low-vision users navigate VR by ear. It watches the headset's video feed in real time, detects interactable objects, signs, and avatars with a custom-trained model, and narrates them back as spatially-placed audio, all without the VR app itself needing to support accessibility.",
  },
  skills: [
    "Java",
    "Spring Boot",
    "Python",
    "SQL",
    "PostgreSQL",
    "GCP",
    "AWS",
    "Docker",
    "Kubernetes",
    "Claude Code",
    "C#",
    "React",
  ],
  values: [
    { name: "Craft", desc: "Readable, tested code ships faster." },
    { name: "Accessibility", desc: "Build for everyone by default." },
    { name: "Curiosity", desc: "Learn in public; iterate quickly." },
  ],
};

function NavLink({ href, idKey, children, currentKey, pulse, onClick, variant = "item" }) {
  const isActive = currentKey === idKey;
  const reduceMotion = usePrefersReducedMotion();
  const labelClass =
    variant === "brand"
      ? "draw-underline font-display text-lg font-normal tracking-tight"
      : `${isActive ? "font-medium" : "draw-underline"}`;
  return (
    <a href={href} onClick={onClick} className="relative inline-flex min-h-11 items-center px-0.5">
      <span className={labelClass}>{children}</span>
      {isActive && (
        <>
          <motion.span
            layoutId="nav-underline"
            className="absolute left-0 right-0 bottom-2 h-[2px] rounded bg-foreground"
            transition={{ type: "spring", stiffness: 600, damping: 38 }}
          />
          {!reduceMotion && (
            <motion.span
              key={`echo-${idKey}-${pulse}`}
              className="absolute left-0 right-0 bottom-2 h-[2px] rounded bg-foreground/40"
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

// Every section is a step of the brew. Numbers, edges and angles are uneven on purpose.
const BREW = {
  home: { step: "00 · grind · 18g" },
  work: { step: "01 · pour · past extractions", num: "02", rot: -11, pos: "-right-8 -bottom-12 text-[11rem] lg:text-[16rem]", tilt: 1 },
  "what-i-do": { step: "02 · froth · 60°c", num: "03", rot: 7, pos: "-left-12 top-24 text-[10rem] lg:text-[14rem]", tilt: -1, jag: true },
  projects: { step: "03 · side roast", num: "04", rot: -4, pos: "right-10 -top-6 text-[9rem] lg:text-[12rem]", tilt: 1, jag: true },
  publication: { step: "04 · single origin · CHI 2025", num: "05", rot: 13, pos: "left-[40%] -bottom-16 text-[12rem] lg:text-[18rem]", tilt: -1 },
  education: { step: "05 · where the beans grew", num: "06", rot: -9, pos: "left-8 bottom-6 text-[8rem] lg:text-[11rem]", tilt: 1, jag: true },
  skills: { step: "06 · tasting notes", num: "07", rot: 5, pos: "-right-4 -top-8 text-[11rem] lg:text-[15rem]", tilt: -1, jag: true },
  about: { step: "07 · sip", num: "08", rot: -14, pos: "right-[20%] -bottom-20 text-[12rem] lg:text-[17rem]", tilt: 1 },
  contact: { step: "08 · refill", num: "09", rot: 10, pos: "right-4 top-16 text-[9rem] lg:text-[13rem]", tilt: -1, jag: true },
};

const Section = ({ id, title, wash, indent, labelledBy, tabIndex, compact, children }) => {
  const ground = groundOf(id);
  const next = nextGroundOf(id);
  const hasVisibleTitle = Boolean(title && title.trim());
  const headingId = hasVisibleTitle ? `${id}-heading` : labelledBy;
  const brew = BREW[id] ?? {};
  const stepRot = ((id.length * 7) % 9) - 4;
  return (
    <section
      id={id}
      tabIndex={tabIndex}
      aria-labelledby={headingId}
      className={`relative grid min-h-screen w-full snap-start items-center overflow-hidden bg-background text-foreground ${
        ground.dark ? "ground-dark crema-wash" : "ground-light"
      }`}
      style={{
        ...groundVars(ground),
        "--wash-x": wash?.x,
        "--wash-y": wash?.y,
        "--wash-a": ground.wash?.[0],
        "--wash-b": ground.wash?.[1],
      }}
    >
      {next && <SlantEdge color={next.bg} tilt={brew.tilt ?? -1} jag={brew.jag} />}
      {brew.num && (
        <OutlineNumber rotate={brew.rot} dark={ground.dark} className={brew.pos}>
          {brew.num}
        </OutlineNumber>
      )}
      <div
        className={`relative z-20 mx-auto max-w-5xl px-6 py-20 text-foreground sm:px-8 lg:max-w-6xl xl:max-w-7xl ${compact ? "lg:py-14" : "lg:py-32 xl:py-40"} ${
          indent === "left" ? "lg:pr-16 xl:pr-28" : indent === "right" ? "lg:pl-16 xl:pl-28" : ""
        }`}
      >
        {hasVisibleTitle && (
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <h2 id={headingId} className="font-mono text-[11px] font-normal uppercase tracking-[0.2em] text-muted-foreground">
              {title}
            </h2>
            {brew.step && (
              <StepTag rotate={stepRot} className="text-[var(--accent-text)]">
                {brew.step}
              </StepTag>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

function ExtractionCard({ job, idx }) {
  const [hover, setHover] = useState(false);
  const tilt = [-1.6, 1.1, -0.5, 2.1][idx % 4];
  const shift = ["lg:ml-0", "lg:ml-14", "lg:ml-4", "lg:ml-24"][idx % 4];
  const width = ["lg:w-[92%]", "lg:w-[84%]", "lg:w-[88%]", "lg:w-[78%]"][idx % 4];
  return (
    <motion.div
      variants={item}
      className={`relative ${shift} ${width}`}
      style={{ rotate: `${tilt}deg` }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      whileHover={{ y: -3, rotate: tilt * 0.4 }}
    >
      {idx % 2 === 1 && <Tape className="-top-3 left-10" rotate={idx === 1 ? -7 : 5} width={80} />}
      <Card className={`overflow-hidden rounded-none ${idx === 2 ? "torn-right" : ""} ${idx === 3 ? "border-dashed" : ""}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xl leading-tight">
            <CremaCup spinning={hover} size={34} className="-ml-1 shrink-0" />
            <span>{job.role}</span>
            <span className="text-muted-foreground">@ {job.org}</span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">{job.period}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{job.summary}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function App() {
  useDynamicFavicon();
  const reduceMotion = usePrefersReducedMotion();
  const [active, setActive] = useState("home");
  const [pulse, setPulse] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const activeGround = groundOf(active);

  useEffect(() => {
    const ids = SECTION_ORDER;
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

  useEffect(() => installAvoid(), []);
  useEffect(() => setPulse((p) => p + 1), [active]);
  const [extracting, startExtraction] = useExtraction();
  const refill = () => {
    if (reduceMotion) {
      window.scrollTo(0, 0);
      return;
    }
    // The shot intro covers the screen first, so the jump to the top is never seen.
    setShowIntro(true);
    setTimeout(() => window.scrollTo(0, 0), 120);
  };

  const goToSection = useSectionPager(PAGER_IDS, { reduceMotion });

  const scrollToSection = (id) => (e) => {
    e.preventDefault();
    goToSection(id);
  };


  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start end", "end start"] });
  const heroYRaw = useTransform(heroProgress, [0, 1], [0, -12]);
  const heroOpacityRaw = useTransform(heroProgress, [0, 1], [1, 0.95]);
  const heroY = reduceMotion ? 0 : heroYRaw;
  const heroOpacity = reduceMotion ? 1 : heroOpacityRaw;

  const [workRef, workProgress] = useSectionProgress();
  const [doRef, doProgress] = useSectionProgress();

  const { scrollYProgress: pageProgress } = useScroll();
  const [showFlourish, setShowFlourish] = useState(false);
  const flourishFired = useRef(false);
  useEffect(() => {
    const unsub = pageProgress.on("change", (p) => {
      if (p >= 0.98 && !flourishFired.current) {
        flourishFired.current = true;
        setShowFlourish(true);
      }
    });
    return unsub;
  }, [pageProgress]);

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
      ok(/Rakuten/.test(employers) && /INTEGRATE|MadAbility|Nixma/.test(employers), "Experience orgs incomplete");
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
    <MotionConfig reducedMotion="user" transition={{ type: "spring", bounce: 0.2 }}>
      <div className="min-h-screen bg-background font-sans text-foreground">
        <a
          href="#home"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded focus:bg-espresso focus:px-4 focus:py-2 focus:text-sm focus:text-milk focus:outline-caramel"
        >
          Skip to content
        </a>
        {showIntro && !reduceMotion && <ShotIntro onDone={() => setShowIntro(false)} />}
        <PourStream edge={activeGround.fg} />
        <LatteRipple />
        <SteamTrail />
        <ScrollProgressGauge dark={activeGround.dark} />
        <BackgroundShapes active={active} dark={activeGround.dark} />
        <CoffeeToys dark={activeGround.dark} />

        <header
          className="sticky top-0 z-30 border-b border-border bg-[color-mix(in_srgb,var(--background)_92%,transparent)] text-foreground backdrop-blur transition-[background-color,color,border-color] duration-500"
          style={groundVars(activeGround)}
        >
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-2 sm:px-8">
            <NavLink href="#home" idKey="home" currentKey={active} pulse={pulse} onClick={scrollToSection("home")} variant="brand">
              ZX Ching
            </NavLink>
            <div className="hidden gap-5 text-sm text-foreground lg:flex">
              {navItems.map(({ id, label }) => (
                <NavLink key={id} href={`#${id}`} idKey={id} currentKey={active} pulse={pulse} onClick={scrollToSection(id)}>
                  {label}
                </NavLink>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button asChild size="sm" className="relative overflow-hidden">
                <a href={resumePdf} target="_blank" rel="noreferrer" onClick={startExtraction}>
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 bg-[var(--mark)]"
                    initial={false}
                    animate={{ width: extracting ? "100%" : "0%" }}
                    transition={{ duration: extracting ? 0.8 : 0.2, ease: "easeInOut" }}
                  />
                  <FileDown className="relative h-4 w-4 mr-2" />
                  <span className="relative">{extracting ? "Extracting…" : "Resume"}</span>
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              </Button>
              <button
                type="button"
                className="-mr-1 flex h-11 w-11 items-center justify-center text-foreground transition-transform duration-150 active:scale-95 lg:hidden"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-nav-panel"
                onClick={() => setMobileNavOpen((v) => !v)}
              >
                {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
            <AnimatePresence>
              {mobileNavOpen && (
                <motion.div
                  id="mobile-nav-panel"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
                  className="absolute inset-x-0 top-full flex flex-col border-b border-border bg-background text-sm text-foreground lg:hidden"
                >
                  {navItems.map(({ id, label }) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      onClick={(e) => {
                        scrollToSection(id)(e);
                        setMobileNavOpen(false);
                      }}
                      className={`flex min-h-12 items-center border-t border-border px-6 first:border-t-0 sm:px-8 ${active === id ? "font-medium" : ""}`}
                    >
                      {label}
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </header>

        <Section id="home" wash={{ x: "80%", y: "10%" }} labelledBy="home-heading" tabIndex={-1}>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-16 select-none font-display text-[9rem] font-semibold leading-none text-foreground/10 sm:text-[13rem]"
            style={{ transform: "rotate(8deg)" }}
          >
            01
          </div>

          <motion.div ref={heroRef} style={{ y: heroY, opacity: heroOpacity }} layout className="relative">
            <div className="grid items-start gap-10 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_340px] xl:grid-cols-[1.2fr_380px]">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">PORTFOLIO</p>
                  <StepTag rotate={-3} className="text-[var(--accent-text)]">{BREW.home.step}</StepTag>
                </div>
                <h1 id="home-heading" className="font-display text-[2.75rem] font-light leading-[1.12] tracking-[-0.02em] sm:text-6xl md:leading-[1.02] md:text-7xl lg:text-[5.5rem] xl:text-[5.75rem]">
                  Currently a{" "}
                  <span className="wonky-underline inline-block -rotate-2 font-display font-light italic text-caramel">coffee-craved</span>{" "}
                  software engineer.
                </h1>
                <p className="mt-6 max-w-lg text-base text-muted-foreground sm:text-lg">
                  Navigating one complex microservice architecture at a time.
                </p>

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
                        <span className="sr-only"> (opens in new tab)</span>
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
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    </Button>
                  </motion.div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">{PROFILE.pronouns}</span>
                </div>
              </div>

              <div className="relative lg:-ml-6 lg:mt-24 lg:rotate-[2.5deg]">
                <CoffeeRing className="-left-16 -top-20 hidden lg:block" size={190} rotate={24} opacity={0.35} />
                <Tape className="-top-3 left-1/3" rotate={-6} />
                <div className="pointer-events-none absolute -bottom-16 -left-24 hidden items-start gap-1 text-muted-foreground lg:flex">
                  <HandNote rotate={-8}>latte no. 2, probably</HandNote>
                  <HandArrow className="h-10 w-14 -translate-y-6" rotate={-30} />
                </div>
                <Card className="torn-bottom rounded-none border-dashed pb-3">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-2xl font-light italic tracking-tight">Now</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0">
                    <dl className="divide-y divide-dashed divide-border border-y border-dashed border-border">
                      {[
                        ["Bean", PROFILE.now.title],
                        ["Origin", "Tokyo"],
                        ["Brew time", PROFILE.now.period],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-baseline gap-4 py-2">
                          <dt className="w-[5.5rem] shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
                          <dd className="text-sm font-medium">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground">{PROFILE.now.footer}</CardFooter>
                </Card>
              </div>
            </div>
          </motion.div>
        </Section>

        <Section id="work" title="Experience" indent="left" compact>
          <VerticalLabel progress={workProgress} className="left-0 top-1/2 hidden -translate-y-1/2 text-foreground/20 lg:block">
            Experience
          </VerticalLabel>
          <motion.div
            ref={workRef}
            variants={stagger}
            initial={reduceMotion ? false : "hidden"}
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="relative grid gap-5"
          >
            <CoffeeRing className="-right-10 top-1/3 hidden lg:block" size={150} rotate={-40} opacity={0.3} />
            {PROFILE.experience.map((job, idx) => (
              <ExtractionCard key={idx} job={job} idx={idx} />
            ))}
          </motion.div>
        </Section>

        <Section id="what-i-do" title="What I Do" wash={{ x: "15%", y: "15%" }}>
          <VerticalLabel progress={doProgress} className="left-0 top-1/2 hidden -translate-y-1/2 text-foreground/25 lg:block">
            What I Do
          </VerticalLabel>
          <FoamBubbles notes={["notes of Java", "long Spring Boot finish", "a hint of Python", "Kubernetes, lightly", "Claude Code aftertaste", "SQL, bitter but honest"]} />
          <div ref={doRef} className="relative z-20 grid gap-6 sm:grid-cols-[1.2fr_0.9fr_1.1fr] sm:items-start">
            {PROFILE.whatIDo.map((doItem, i) => (
              <motion.div
                key={doItem.title}
                variants={item}
                initial={reduceMotion ? false : "hidden"}
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                className={["sm:mt-0 sm:-rotate-[2.5deg]", "sm:mt-20 sm:rotate-[1.5deg]", "sm:mt-6 sm:-rotate-[0.8deg]"][i]}
              >
                <Card className={`rounded-none ${i === 1 ? "torn-bottom bg-[var(--card-alt)]" : ""} ${i === 2 ? "border-dashed" : ""}`}>
                  <CardHeader className="pb-2">
                    <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent-text)]">{["65°C", "60°C", "55°C"][i]}</span>
                    <CardTitle className={i === 0 ? "font-display text-2xl font-light italic" : "text-xl leading-tight"}>{doItem.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{doItem.desc}</CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <p className="font-hand relative z-20 mt-10 -rotate-2 text-2xl text-[var(--accent-text)]">pop a bubble, there's a tasting note in each</p>
        </Section>

        <Section id="projects" title="Projects" compact>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
            <div className="lg:order-last">
              <AlgorithmRace />
              <p className="mt-3 text-sm text-muted-foreground">
                A live maze-solver comparing three search algorithms, running in your browser.
              </p>
            </div>
            <motion.div
              variants={stagger}
              initial={reduceMotion ? false : "hidden"}
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid gap-4"
            >
              {PROFILE.projects.map((p, i) => (
                <motion.div key={i} variants={item} layout className={`relative ${["-rotate-[1.2deg]", "ml-6 rotate-[0.8deg]", "-ml-2 -rotate-[0.4deg]"][i % 3]}`}>
                  {p.status && <Tape className="-top-3 right-10" rotate={9} width={70} />}
                  {p.status && (
                    <div className="pointer-events-none absolute -top-9 left-40 z-10 hidden items-end gap-1 text-[var(--accent-text)] lg:flex">
                      <HandNote rotate={-5}>still roasting, don't peek</HandNote>
                      <HandArrow className="h-8 w-12 translate-y-3" rotate={110} />
                    </div>
                  )}
                  <Card className="relative overflow-hidden rounded-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex flex-wrap items-center gap-2 text-xl leading-tight">
                        {p.title}
                        {p.status && <span className="border border-border px-2 py-0.5 font-mono text-[10px] font-normal uppercase tracking-widest text-muted-foreground">{p.status}</span>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{p.blurb}</p>
                      <motion.div className="mt-3 flex flex-wrap gap-2" variants={stagger} initial={reduceMotion ? false : "hidden"} whileInView="show" viewport={{ once: true }}>
                        {p.tech.map((t) => (
                          <Pill key={t}>{t}</Pill>
                        ))}
                      </motion.div>
                      {p.details && (
                        <motion.ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground" variants={stagger} initial={reduceMotion ? false : "hidden"} whileInView="show" viewport={{ once: true }}>
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
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm text-muted-foreground">More on GitHub</p>
            <GithubRepos />
          </div>
        </Section>

        <Section id="publication" title="Publication" wash={{ x: "85%", y: "50%" }}>
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <Reveal>
              <Card>
                <CardContent className="py-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <BookOpen className="h-5 w-5 mb-3 sm:mb-0" />
                    <div className="space-y-1">
                      <div className="text-sm font-medium sm:text-base">{PROFILE.publication.title}</div>
                      <div className="text-sm text-muted-foreground">{PROFILE.publication.authors}</div>
                      <p className="pt-2 text-sm text-muted-foreground">{PROFILE.publication.summary}</p>
                      <div className="pt-1">
                        <a className="link-rest draw-underline inline-flex min-h-11 items-center text-sm sm:min-h-0" href={PROFILE.publication.link} target="_blank" rel="noreferrer">
                          Read the DOI
                          <span className="sr-only"> (opens in new tab)</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
            <PaperShowcase />
          </div>
        </Section>

        <Section id="education" title="Education" indent="right">
          <Reveal>
            <div className="relative" style={{ transform: "rotate(-1.5deg)" }}>
              <CoffeeRing className="-right-16 -top-24" size={140} rotate={70} opacity={0.4} />
              <Card>
                <CardContent className="py-6" style={{ transform: "rotate(1.5deg)" }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <School className="h-5 w-5 mb-3 sm:mb-0" />
                    <div>
                      <div className="font-medium">
                        {PROFILE.education.school}, {PROFILE.education.degree}
                      </div>
                      <div className="text-sm text-muted-foreground">{PROFILE.education.period}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Reveal>
        </Section>

        <Section id="skills" title="Skills" wash={{ x: "15%", y: "85%" }}>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <Reveal>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl">Technical</CardTitle>
                </CardHeader>
                <CardContent>
                  <motion.div className="flex flex-wrap gap-2" variants={stagger} initial={reduceMotion ? false : "hidden"} whileInView="show" viewport={{ once: true }}>
                    {PROFILE.skills.map((s, i) => (
                      <span key={s} className="inline-block" style={{ transform: `rotate(${((i * 37) % 11) - 5}deg) translateY(${((i * 13) % 7) - 3}px)` }}>
                        <Pill>{s}</Pill>
                      </span>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            </Reveal>

            <motion.div variants={stagger} initial={reduceMotion ? false : "hidden"} whileInView="show" viewport={{ once: true }} className="grid gap-4">
              {PROFILE.values.map((v) => (
                <motion.div key={v.name} variants={item} layout>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{v.name}</CardTitle>
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
            <div className="relative shrink-0 border border-border bg-milk p-1 pb-6 shadow-[6px_8px_0_rgb(20_14_11/0.14)]" style={{ transform: "rotate(4deg)" }}>
              <Tape className="-top-3 left-6" rotate={-12} width={70} />
              <img src={aboutPhoto} alt={`${PROFILE.name} outdoors`} className="h-40 w-40 object-cover sm:h-48 sm:w-48" />
            </div>
            <div>
              <p className="text-lg leading-relaxed sm:text-xl">{PROFILE.about}</p>
              <motion.div
                className="mt-4 flex flex-wrap gap-2"
                variants={stagger}
                initial={reduceMotion ? false : "hidden"}
                whileInView="show"
                viewport={{ once: true }}
              >
                {PROFILE.coffeeOrders.map((o) => (
                  <Pill key={o}>{o}</Pill>
                ))}
              </motion.div>
              <p className="mt-3 text-sm text-muted-foreground">{PROFILE.coffeeNote}</p>
            </div>
          </div>
        </Section>

        <Section id="contact" wash={{ x: "85%", y: "90%" }} labelledBy="contact-heading">
          <div className="relative">
            <AnimatePresence>
              {showFlourish && !reduceMotion && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -22 }}
                  transition={{ duration: 1.8, times: [0, 0.2, 0.7, 1], ease: EASE }}
                  onAnimationComplete={() => setShowFlourish(false)}
                  className="pointer-events-none absolute -top-10 left-0 text-muted-foreground"
                  aria-hidden="true"
                >
                  <SteamShape w={0.6} />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mb-3 flex items-center gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">CONTACT</p>
              <StepTag rotate={3} className="text-[var(--accent-text)]">{BREW.contact.step}</StepTag>
            </div>
            <h2 id="contact-heading" className="max-w-2xl font-display text-4xl font-light leading-[1.02] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
              Always open for the next pour.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">{PROFILE.contactNote}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <a href={`mailto:${PROFILE.email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </a>
              </Button>
              <Button asChild variant="outline" className="border-foreground text-foreground hover:bg-foreground hover:text-background">
                <a href={PROFILE.links.github} target="_blank" rel="noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              </Button>
              <Button asChild variant="outline" className="border-foreground text-foreground hover:bg-foreground hover:text-background">
                <a href={PROFILE.links.linkedin} target="_blank" rel="noreferrer">
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              </Button>
            </div>
            <div className="mt-14 flex justify-end">
              <EmptyCup onRefill={refill} />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
              <span>© {new Date().getFullYear()} ZX Ching · the cup is empty, thanks for drinking</span>
              <span>Built with React · Tailwind · shadcn/ui</span>
            </div>
          </div>
        </Section>
      </div>
      <Analytics />
    </MotionConfig>
  );
}
