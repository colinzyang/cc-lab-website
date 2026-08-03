import React from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useBreadcrumb } from "../src/context/BreadcrumbContext";
import { useDocumentTitle } from "../src/hooks/useDocumentTitle";
import {
  loadLabInfo,
  loadMembers,
  loadResearch,
  loadPublications,
  LabInfo,
  ContactInfo,
  Member,
  ResearchData,
  ResearchDirection,
  Publication,
} from "../src/lib/dataLoader";

// ---- Types ----
interface HomeData {
  labInfo: LabInfo | null;
  contact: ContactInfo | null;
  pi: Member | null;
  memberCount: number;
  alumniCount: number;
  research: ResearchData | null;
  allPubs: Publication[];
  pubCount: number;
}

// ---- Helper: scramble glyphs ----
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%*/<>{}[]=+";

// ---- DNA Helix Canvas ----
const HelixCanvas: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rafRef = React.useRef<number>(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;

    const resize = () => {
      if (!canvas) return;
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const nodes = 34;
    const t0 = performance.now();

    // Dynamic accent color: use CSS custom property
    const getAccent = () => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue("--color-primary-dark").trim() || "#89b4fa";
    };
    const getSubRgba = (a: number) => {
      const style = getComputedStyle(document.documentElement);
      const sub = style.getPropertyValue("--color-subtext").trim() || "#a6adc8";
      // Parse hex to rgba
      const r = parseInt(sub.slice(1, 3), 16);
      const g = parseInt(sub.slice(3, 5), 16);
      const b = parseInt(sub.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    };

    const draw = (now: number) => {
      const accent = getAccent();
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      let cx = W * 0.72;
      if (W < 800) cx = W * 0.5;
      const amplitude = Math.min(W * 0.18, 220);
      const spanH = H * 0.96;
      const top = H * 0.02;

      const pts1: { x: number; y: number; d: number }[] = [];
      const pts2: { x: number; y: number; d: number }[] = [];

      for (let i = 0; i < nodes; i++) {
        const p = i / (nodes - 1);
        const y = top + p * spanH;
        const phase = p * Math.PI * 4 + t * 0.9;
        const x1 = cx + Math.sin(phase) * amplitude;
        const x2 = cx + Math.sin(phase + Math.PI) * amplitude;
        const depth1 = (Math.cos(phase) + 1) / 2;
        const depth2 = (Math.cos(phase + Math.PI) + 1) / 2;
        pts1.push({ x: x1, y: y, d: depth1 });
        pts2.push({ x: x2, y: y, d: depth2 });
      }

      // Rungs
      for (let j = 0; j < nodes; j++) {
        const a = pts1[j];
        const b = pts2[j];
        const rung = Math.min(a.d, b.d);
        ctx.strokeStyle = getSubRgba(0.07 + rung * 0.16);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Backbone dots
      const plot = (pts: { x: number; y: number; d: number }[]) => {
        for (let k = 0; k < pts.length; k++) {
          const pt = pts[k];
          const r = 1.6 + pt.d * 3.2;
          ctx.beginPath();
          const alpha = 0.18 + pt.d * 0.7;
          ctx.fillStyle = accent
            .replace(")", `, ${alpha})`)
            .replace("rgb", "rgba");
          if (accent.startsWith("#")) {
            const rr = parseInt(accent.slice(1, 3), 16);
            const gg = parseInt(accent.slice(3, 5), 16);
            const bb = parseInt(accent.slice(5, 7), 16);
            ctx.fillStyle = `rgba(${rr},${gg},${bb},${alpha})`;
          }
          ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      plot(pts1);
      plot(pts2);

      rafRef.current = requestAnimationFrame(draw);
    };

    if (reduceMotion) {
      draw(t0 + 600);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full z-0 opacity-90 pointer-events-none"
    />
  );
};

// ---- Scramble Text Hook ----
function useScrambleText(
  text: string,
  duration: number = 1.9,
  delay: number = 0.35,
  active: boolean = true,
): { display: string; settled: boolean } {
  const [display, setDisplay] = React.useState("");
  const [settled, setSettled] = React.useState(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (!active) {
      setDisplay(text);
      setSettled(true);
      return;
    }
    if (!text) return;

    const total = text.length;
    const startTime = performance.now();
    const totalMs = duration * 1000;
    const delayMs = delay * 1000;
    let started = false;

    const tick = () => {
      const now = performance.now();
      if (!started) {
        if (now - startTime < delayMs) return;
        started = true;
      }

      const elapsed = now - startTime - delayMs;
      const progress = Math.min(elapsed / totalMs, 1);
      const settled = Math.floor(progress * total);

      let out = "";
      for (let i = 0; i < total; i++) {
        const c = text[i];
        if (c === " ") {
          out += " ";
        } else if (i < settled) {
          out += c;
        } else if (Math.random() > 0.35) {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        } else {
          out += c;
        }
      }
      setDisplay(out);

      if (progress >= 1) {
        setDisplay(text);
        setSettled(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    intervalRef.current = setInterval(tick, 42); // ~24fps
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, duration, delay, active]);

  return { display, settled };
}

// ---- Cursor Blink ----
const Cursor: React.FC = () => (
  <span
    className="inline-block w-[9px] h-[1.05em] bg-primary dark:bg-primary-dark ml-[3px] translate-y-[2px] animate-pulse"
    aria-hidden="true"
  />
);

// ---- Spark Bars ----
const SparkBars: React.FC = () => {
  const bars = React.useMemo(() => {
    const heights: number[] = [];
    for (let i = 0; i < 7; i++) {
      heights.push(0.25 + Math.random() * 0.75);
    }
    return heights;
  }, []);

  return (
    <div className="flex items-end gap-[3px] h-[42px] mb-[18px]">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="flex-1 bg-gradient-to-b from-primary dark:from-primary-dark to-primary/25 dark:to-primary-dark/25 rounded-t-[2px] min-h-[3px]"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: h }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
          style={{ transformOrigin: "bottom center" }}
        />
      ))}
    </div>
  );
};

// ---- Counter Animation ----
const AnimatedCounter: React.FC<{ target: number; suffix?: string }> = ({
  target,
  suffix = "",
}) => {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setCount(Math.round(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <span
      ref={ref}
      className="font-mono text-[clamp(2rem,5vw,3rem)] font-bold text-slate-900 dark:text-text leading-none"
    >
      {count}
      {suffix}
    </span>
  );
};

// ---- Section: HUD Corner Frame ----
const HudCorners: React.FC<{ variant?: "four" | "diag" }> = ({
  variant = "four",
}) => {
  const corner =
    "absolute w-3 h-3 border-2 border-primary dark:border-primary-dark";
  if (variant === "diag") {
    return (
      <>
        <span
          className={`${corner} top-[-1px] left-[-1px] border-r-0 border-b-0`}
        />
        <span
          className={`${corner} bottom-[-1px] right-[-1px] border-l-0 border-t-0`}
        />
      </>
    );
  }
  return (
    <>
      <span
        className={`${corner} top-[-1px] left-[-1px] border-r-0 border-b-0`}
      />
      <span
        className={`${corner} top-[-1px] right-[-1px] border-l-0 border-b-0`}
      />
      <span
        className={`${corner} bottom-[-1px] left-[-1px] border-r-0 border-t-0`}
      />
      <span
        className={`${corner} bottom-[-1px] right-[-1px] border-l-0 border-t-0`}
      />
    </>
  );
};

// ---- Pulse Dot ----
const PulseDot: React.FC = () => (
  <span className="w-2 h-2 rounded-full bg-primary dark:bg-primary-dark shadow-[0_0_10px] shadow-primary dark:shadow-primary-dark animate-pulse" />
);

// ---- DecodeSpan (single word scramble with in-view trigger) ----
const DecodeSpan: React.FC<{
  text: string;
  duration?: number;
  delay?: number;
  className?: string;
}> = ({ text, duration = 0.7, delay = 0, className = "" }) => {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { display } = useScrambleText(text, duration, delay, inView);

  return (
    <span ref={ref} className={className}>
      {inView ? display : text}
    </span>
  );
};

// ---- DecodeHeadline (full multi-word scramble for hero) ----
const DecodeHeadline: React.FC<{ text: string }> = ({ text }) => {
  const { display, settled } = useScrambleText(text, 1.9, 0.35, true);
  return (
    <h1 className="font-mono font-bold text-[clamp(2.2rem,6vw,4.6rem)] leading-[1.06] tracking-[-0.02em] my-[18px] mb-[26px] text-slate-900 dark:text-text max-w-[21ch]">
      {settled ? text : display}
    </h1>
  );
};

// ---- Echo Text (sequence ⇄ structure animation) ----
const EchoText: React.FC = () => {
  const text = "sequence ⇄ structure ⇄ dynamics";
  const [display, setDisplay] = React.useState("");
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    const delayMs = 2100;
    const startTime = performance.now();

    const tick = () => {
      const now = performance.now();
      if (!startedRef.current) {
        if (now - startTime < delayMs) return;
        startedRef.current = true;
      }

      const elapsed = now - startTime - delayMs;
      const progress = Math.min(elapsed / 1200, 1);
      const settled = Math.floor(progress * text.length);

      let out = "";
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === " " || c === "⇄" || i < settled) {
          out += c;
        } else {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      setDisplay(out);

      if (progress >= 1) {
        setDisplay(text);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    };

    intervalRef.current = setInterval(tick, 42);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <span className="font-mono text-[13px] tracking-[0.16em] lowercase text-slate-500 dark:text-subtext min-h-[1em]">
      {display}
    </span>
  );
};

// ---- Echo Graph SVG ----
const EchoGraph: React.FC = () => (
  <span className="inline-flex opacity-85" aria-hidden="true">
    <svg viewBox="0 0 40 40" width="40" height="40">
      <g
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        className="text-gray-300 dark:text-border"
      >
        <line x1="20" y1="8" x2="32" y2="18" />
        <line x1="32" y1="18" x2="27" y2="32" />
        <line x1="27" y1="32" x2="13" y2="32" />
        <line x1="13" y1="32" x2="8" y2="18" />
        <line x1="8" y1="18" x2="20" y2="8" />
        <line x1="20" y1="8" x2="20" y2="22" />
        <line x1="20" y1="22" x2="27" y2="32" />
      </g>
      <g fill="currentColor" className="text-primary dark:text-primary-dark">
        <circle cx="20" cy="8" r="2" />
        <circle cx="32" cy="18" r="2" />
        <circle cx="27" cy="32" r="2" />
        <circle cx="13" cy="32" r="2" />
        <circle cx="8" cy="18" r="2" />
        <circle cx="20" cy="22" r="2" />
      </g>
    </svg>
  </span>
);

// ---- Tick Line ----
const TickLine: React.FC = () => (
  <motion.span
    className="h-px flex-1 min-w-[40px] bg-gradient-to-r from-gray-300 dark:from-border to-transparent"
    initial={{ scaleX: 0 }}
    animate={{ scaleX: 1 }}
    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
    style={{ transformOrigin: "left center" }}
  />
);

// ============== MAIN HOME COMPONENT ==============
export const Home: React.FC = () => {
  const { setBreadcrumbs } = useBreadcrumb();
  useDocumentTitle();

  const [data, setData] = React.useState<HomeData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    Promise.all([
      loadLabInfo(),
      loadMembers(),
      loadResearch(),
      loadPublications(),
    ])
      .then(([labData, memberData, researchData, pubData]) => {
        setData({
          labInfo: labData.LAB_INFO,
          contact: labData.CONTACT,
          pi: memberData.PI,
          memberCount: memberData.MEMBERS.length,
          alumniCount: memberData.ALUMNI.length,
          research: researchData,
          allPubs: pubData.ALL_PUBLICATIONS,
          pubCount: pubData.ALL_PUBLICATIONS.length,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-20">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen pt-20">
        <div className="text-slate-500">Failed to load data.</div>
      </div>
    );
  }

  const { contact, pi, memberCount, alumniCount, research, allPubs, pubCount } =
    data;

  // Take top 7 publications for home display
  const featuredPubs = allPubs.slice(0, 7);

  return (
    <div className="w-full">
      {/* ========== HERO ========== */}
      <section className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center overflow-hidden pt-[60px] pb-[80px]">
        <HelixCanvas />

        <div className="relative z-[2] w-[min(1180px,92vw)] mx-auto">
          {/* Command prompt */}
          <motion.div
            className="font-mono text-sm text-slate-500 dark:text-subtext mb-[34px]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="text-primary dark:text-primary-dark">&gt;</span>{" "}
            cc_lab --init
            <Cursor />
          </motion.div>

          {/* Eyebrow row */}
          <div className="flex items-center gap-[14px] flex-wrap">
            <motion.span
              className="font-mono text-[13px] tracking-[0.22em] uppercase text-primary dark:text-primary-dark"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            >
              CC LAB @ XJTLU
            </motion.span>
            <TickLine />
          </div>

          {/* Headline with scramble */}
          <DecodeHeadline text="Molecules in motion, medicine by design." />

          {/* Subtitle */}
          <motion.p
            className="font-mono text-[clamp(1rem,2.2vw,1.35rem)] text-primary dark:text-primary-dark tracking-[0.02em]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.9, ease: "easeOut" }}
          >
            Towards Physics-inspired Bioinformatics
          </motion.p>

          {/* Echo: sequence ⇄ structure */}
          <motion.p
            className="flex items-center gap-[10px] mt-[18px] font-mono text-[13px] tracking-[0.16em] text-slate-500 dark:text-subtext lowercase"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 2.0, ease: "easeOut" }}
            aria-label="sequence to structure"
          >
            <EchoGraph />
            <EchoText />
          </motion.p>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-[30px] left-1/2 -translate-x-1/2 z-[3] flex flex-col items-center gap-2 font-mono text-xs tracking-[0.18em] uppercase text-slate-500 dark:text-subtext"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.4, ease: "easeOut" }}
        >
          <span>scroll</span>
          <motion.span
            className="material-symbols-outlined text-xl"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            arrow_downward
          </motion.span>
        </motion.div>
      </section>

      {/* ========== MISSION ========== */}
      <section className="py-[110px]">
        <div className="w-[min(1180px,92vw)] mx-auto">
          <motion.div
            className="relative border border-gray-200 dark:border-border bg-gradient-to-b from-gray-50/35 to-gray-50/10 dark:from-[rgba(49,50,68,0.35)] dark:to-[rgba(49,50,68,0.12)] p-[clamp(20px,4vw,56px)]"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <HudCorners variant="four" />

            {/* Head */}
            <motion.div
              className="flex items-center gap-[10px] font-mono text-[13px] text-slate-500 dark:text-subtext mb-6"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <PulseDot /> // mission.txt
            </motion.div>

            {/* Hook */}
            <div className="mission-readout relative">
              <div className="mb-[26px]">
                <motion.p
                  className="font-sans font-black text-[clamp(1.9rem,5.4vw,3.4rem)] leading-[1.12] tracking-[-0.02em] text-slate-900 dark:text-text"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  Sequence is{" "}
                  <DecodeSpan
                    text="language"
                    duration={0.7}
                    className="inline-block text-primary dark:text-primary-dark font-black bg-primary/5 dark:bg-primary-dark/10 border border-gray-200 dark:border-border rounded-[5px] px-[0.22em] whitespace-pre"
                  />
                  .
                </motion.p>
                <motion.p
                  className="font-sans font-black text-[clamp(1.9rem,5.4vw,3.4rem)] leading-[1.12] tracking-[-0.02em] text-slate-900 dark:text-text"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: 0.14, ease: "easeOut" }}
                >
                  Structure is{" "}
                  <DecodeSpan
                    text="physics"
                    duration={0.7}
                    delay={0.12}
                    className="inline-block text-primary dark:text-primary-dark font-black bg-primary/5 dark:bg-primary-dark/10 border border-gray-200 dark:border-border rounded-[5px] px-[0.22em] whitespace-pre"
                  />
                  .
                </motion.p>
              </div>

              {/* Resolution */}
              <motion.p
                className="relative z-[2] font-sans font-light text-[clamp(1.1rem,2.4vw,1.5rem)] leading-relaxed text-slate-500 dark:text-subtext max-w-[46ch] mt-[6px]"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              >
                We{" "}
                <DecodeSpan
                  text="fuse"
                  duration={0.6}
                  className="font-semibold text-primary dark:text-primary-dark not-italic"
                />{" "}
                biological foundation models with molecular dynamics to decode
                molecular mechanisms and engineer next-generation therapeutics.
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== RESEARCH ========== */}
      <section className="py-[90px]">
        <div className="w-[min(1180px,92vw)] mx-auto">
          <motion.div
            className="font-mono text-[13px] text-slate-500 dark:text-subtext tracking-[0.04em] mb-[14px]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            // research_directions.map
          </motion.div>

          <motion.h2
            className="text-[clamp(1.8rem,4vw,2.8rem)] font-black tracking-[-0.02em] mb-2 text-slate-900 dark:text-text"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Four lines of inquiry,{" "}
            <em className="not-italic text-primary dark:text-primary-dark">
              one intersection
            </em>
            .
          </motion.h2>

          {research?.directions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[22px] mt-[42px]">
              {research.directions.map((dir: ResearchDirection, i: number) => (
                <motion.article
                  key={dir.id}
                  className="relative border border-gray-200 dark:border-border bg-gradient-to-b from-gray-50/35 to-gray-50/10 dark:from-[rgba(49,50,68,0.35)] dark:to-[rgba(49,50,68,0.12)] p-[28px_26px_26px] overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <HudCorners variant="diag" />

                  {/* Draw line */}
                  <motion.span
                    className="absolute top-0 left-0 h-[2px] w-full bg-primary dark:bg-primary-dark origin-left"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
                  />

                  <span className="font-mono text-[13px] text-primary dark:text-primary-dark tracking-[0.08em]">
                    [{String(i + 1).padStart(2, "0")}] · {dir.id}
                  </span>
                  <h3 className="text-[1.32rem] font-bold my-[8px] mb-[14px] leading-[1.25] text-slate-900 dark:text-text">
                    {dir.title}
                  </h3>
                  <p className="font-mono text-[0.92rem] text-primary dark:text-primary-dark leading-[1.5] mb-[14px] pl-[14px] border-l-2 border-gray-200 dark:border-border">
                    {dir.question}
                  </p>
                  <p className="text-[0.96rem] text-slate-500 dark:text-subtext mb-[18px]">
                    {dir.description}
                  </p>
                  {dir.keyAreas && dir.keyAreas.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {dir.keyAreas.map((area: string) => (
                        <motion.span
                          key={area}
                          className="font-mono text-[11.5px] text-slate-900 dark:text-text bg-primary/5 dark:bg-primary-dark/10 border border-gray-200 dark:border-border px-[10px] py-[5px] rounded-[4px] tracking-[0.01em]"
                          initial={{ opacity: 0, y: 8 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-80px" }}
                          transition={{
                            duration: 0.4,
                            delay: 0.5 + i * 0.06,
                            ease: "easeOut",
                          }}
                        >
                          <span className="text-primary dark:text-primary-dark">
                            ▸{" "}
                          </span>
                          {area}
                        </motion.span>
                      ))}
                    </div>
                  )}
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section className="py-[90px] border-t border-b border-gray-200 dark:border-border">
        <div className="w-[min(1180px,92vw)] mx-auto">
          <motion.div
            className="flex items-center gap-[10px] font-mono text-[13px] text-slate-500 dark:text-subtext mb-[36px]"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <PulseDot /> // telemetry.stream
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Publications */}
            <motion.div
              className="relative border border-gray-200 dark:border-border bg-gradient-to-b from-gray-50/35 to-gray-50/10 dark:from-[rgba(49,50,68,0.35)] dark:to-[rgba(49,50,68,0.12)] p-[22px_20px]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <HudCorners variant="diag" />
              <SparkBars />
              <AnimatedCounter target={pubCount} suffix="+" />
              <div className="font-mono text-[12.5px] text-slate-500 dark:text-subtext tracking-[0.04em] mt-[10px] uppercase">
                Publications
              </div>
            </motion.div>

            {/* Team Members */}
            <motion.div
              className="relative border border-gray-200 dark:border-border bg-gradient-to-b from-gray-50/35 to-gray-50/10 dark:from-[rgba(49,50,68,0.35)] dark:to-[rgba(49,50,68,0.12)] p-[22px_20px]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              <HudCorners variant="diag" />
              <SparkBars />
              <AnimatedCounter target={memberCount} suffix="+" />
              <div className="font-mono text-[12.5px] text-slate-500 dark:text-subtext tracking-[0.04em] mt-[10px] uppercase">
                Team members
              </div>
            </motion.div>

            {/* Alumni */}
            <motion.div
              className="relative border border-gray-200 dark:border-border bg-gradient-to-b from-gray-50/35 to-gray-50/10 dark:from-[rgba(49,50,68,0.35)] dark:to-[rgba(49,50,68,0.12)] p-[22px_20px]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              <HudCorners variant="diag" />
              <SparkBars />
              <AnimatedCounter target={alumniCount} suffix="+" />
              <div className="font-mono text-[12.5px] text-slate-500 dark:text-subtext tracking-[0.04em] mt-[10px] uppercase">
                Alumni
              </div>
            </motion.div>

            {/* Years */}
            <motion.div
              className="relative border border-gray-200 dark:border-border bg-gradient-to-b from-gray-50/35 to-gray-50/10 dark:from-[rgba(49,50,68,0.35)] dark:to-[rgba(49,50,68,0.12)] p-[22px_20px]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <HudCorners variant="diag" />
              <SparkBars />
              <AnimatedCounter target={10} suffix="" />
              <div className="font-mono text-[12.5px] text-slate-500 dark:text-subtext tracking-[0.04em] mt-[10px] uppercase">
                Years of research
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== PUBLICATIONS ========== */}
      <section className="py-[100px]">
        <div className="w-[min(1180px,92vw)] mx-auto">
          <motion.div
            className="font-mono text-[13px] text-slate-500 dark:text-subtext tracking-[0.04em] mb-[14px]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            // publications.log
          </motion.div>

          <motion.h2
            className="text-[clamp(1.8rem,4vw,2.8rem)] font-black tracking-[-0.02em] mb-2 text-slate-900 dark:text-text"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Selected Publications
          </motion.h2>

          <div className="mt-[38px] border-t border-gray-200 dark:border-border">
            {featuredPubs.map((pub, i) => (
              <motion.div
                key={pub.id || i}
                className="grid grid-cols-[34px_1fr_auto] gap-5 items-start py-[22px] px-2 border-b border-gray-200 dark:border-border transition-colors hover:bg-primary/[0.02] dark:hover:bg-primary-dark/[0.04] max-md:grid-cols-1 max-md:gap-2"
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              >
                <span className="font-mono text-xs text-primary dark:text-primary-dark pt-1">
                  {String(i + 1).padStart(3, "0")}
                </span>
                <span className="text-[1.04rem] font-medium leading-[1.4] text-slate-900 dark:text-text">
                  {pub.title}
                </span>
                <span className="font-mono text-xs text-slate-500 dark:text-subtext whitespace-nowrap text-right bg-primary/[0.03] dark:bg-primary-dark/[0.06] border border-gray-200 dark:border-border px-[10px] py-[6px] rounded-[4px] self-start max-md:text-left max-md:justify-self-start max-md:whitespace-normal">
                  {pub.journal}
                  {pub.date ? ` · ${pub.date}` : ""}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              to="/publication"
              className="group inline-flex items-center gap-3 border-2 border-primary dark:border-primary-dark px-6 py-2.5 text-primary dark:text-primary-dark font-bold text-lg tracking-tight hover:bg-primary dark:hover:bg-primary-dark hover:text-white dark:hover:text-slate-900 transition-all duration-300"
            >
              View All Publications
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ========== PI ========== */}
      <section className="py-[100px]">
        <div className="w-[min(1180px,92vw)] mx-auto">
          <motion.div
            className="font-mono text-[13px] text-slate-500 dark:text-subtext tracking-[0.04em] mb-[14px]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            // pi.profile
          </motion.div>

          <motion.h2
            className="text-[clamp(1.8rem,4vw,2.8rem)] font-black tracking-[-0.02em] mb-2 text-slate-900 dark:text-text"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Principal Investigator
          </motion.h2>

          <div className="grid grid-cols-[300px_1fr] gap-12 items-start mt-[38px] max-md:grid-cols-1 max-md:gap-7">
            {/* PI Photo */}
            {pi && (
              <motion.div
                className="relative aspect-square bg-gray-100 dark:bg-surface overflow-hidden border border-gray-200 dark:border-border max-md:max-w-[260px]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <HudCorners variant="four" />
                {/* Scan bar */}
                <motion.span
                  className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary dark:via-primary-dark to-transparent z-10"
                  initial={{ top: "0%", opacity: 0 }}
                  whileInView={{ top: "100%", opacity: [0, 0.7, 0] }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 1.4,
                    ease: "easeInOut",
                    times: [0, 0.5, 1],
                  }}
                />
                <img
                  src={pi.image}
                  alt={pi.name}
                  className="w-full h-full object-cover block"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </motion.div>
            )}

            {/* PI Info */}
            <div>
              <motion.div
                className="text-[1.9rem] font-black tracking-[-0.02em] text-slate-900 dark:text-text"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              >
                {pi?.name || "Kevin Chan, PhD"}
              </motion.div>
              <motion.div
                className="font-mono text-[0.95rem] text-primary dark:text-primary-dark my-[6px] mb-[22px]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                {pi?.title || "Assistant Professor"}
              </motion.div>
              <motion.p
                className="text-slate-500 dark:text-subtext text-[1.02rem] max-w-[60ch] mb-[18px]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              >
                {pi?.bio_long ||
                  "Kevin received his PhD from City University of Hong Kong and completed postdoctoral training at The Ohio State University."}
              </motion.p>

              {/* Now badge */}
              <motion.div
                className="relative overflow-hidden max-w-[60ch] p-[14px_18px] border border-gray-200 dark:border-border border-l-2 border-l-primary dark:border-l-primary-dark rounded-r-[6px] bg-gradient-to-r from-primary/[0.04] dark:from-primary-dark/[0.09] to-primary/[0.01] dark:to-primary-dark/[0.02]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              >
                {/* Highlight sweep */}
                <motion.span
                  className="absolute top-0 bottom-0 w-[42%] pointer-events-none"
                  initial={{ left: "-45%", opacity: 0 }}
                  whileInView={{ left: "105%", opacity: [0, 1, 0] }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 1.1,
                    delay: 0.25,
                    ease: "easeInOut",
                    times: [0, 0.5, 1],
                  }}
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(137,180,250,0.16), transparent)",
                  }}
                />

                <div className="inline-flex items-center gap-[7px] font-mono text-[11px] tracking-[0.18em] uppercase text-primary dark:text-primary-dark mb-[9px]">
                  <PulseDot /> now
                </div>
                <p className="text-slate-900 dark:text-text text-[1.02rem]">
                  In{" "}
                  <span className="text-primary dark:text-primary-dark font-medium">
                    2024
                  </span>
                  , he joined Department of Biosciences and Bioinformatics,{" "}
                  <span className="text-primary dark:text-primary-dark font-medium">
                    XJTLU
                  </span>
                  . He is now also the{" "}
                  <span className="text-primary dark:text-primary-dark font-medium">
                    deputy director
                  </span>{" "}
                  of the Center for Intelligent RNA Therapeutics at XJTLU.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CONTACT ========== */}
      <section className="py-[110px] border-t border-gray-200 dark:border-border">
        <div className="w-[min(1180px,92vw)] mx-auto">
          <motion.div
            className="font-mono text-[13px] text-slate-500 dark:text-subtext tracking-[0.04em] mb-[14px]"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            // get_in_touch
          </motion.div>

          <motion.h2
            className="text-[clamp(1.8rem,4.6vw,3.2rem)] font-light leading-[1.2] tracking-[-0.01em] max-w-[20ch] mb-[40px] text-slate-900 dark:text-text"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Meet at the{" "}
            <em className="not-italic text-primary dark:text-primary-dark font-medium">
              interface
            </em>{" "}
            of computation and biology.
          </motion.h2>

          <div className="flex flex-wrap gap-x-12 gap-y-7 mb-[40px]">
            {contact && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                >
                  <div className="font-mono text-xs text-slate-500 dark:text-subtext uppercase tracking-[0.12em] mb-[6px]">
                    Email
                  </div>
                  <a
                    href={`mailto:${contact.email}`}
                    className="font-mono text-[1.05rem] text-slate-900 dark:text-text hover:text-primary dark:hover:text-primary-dark transition-colors"
                  >
                    {contact.email}
                  </a>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                >
                  <div className="font-mono text-xs text-slate-500 dark:text-subtext uppercase tracking-[0.12em] mb-[6px]">
                    Office
                  </div>
                  <div className="font-mono text-[1.05rem] text-slate-900 dark:text-text">
                    {contact.office}
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Thin footer-like bar inside contact section */}
          <div className="pt-7 border-t border-gray-200 dark:border-border font-mono text-[13px] text-slate-500 dark:text-subtext flex justify-between flex-wrap gap-3">
            <span>
              <span className="text-primary dark:text-primary-dark">&gt;</span>{" "}
              CC Lab · Xi'an Jiaotong-Liverpool University · School of Science
            </span>
            <span>
              eof
              <Cursor />
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
