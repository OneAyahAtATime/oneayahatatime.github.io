import { useEffect, useLayoutEffect, useState } from "react";

/**
 * A short walk around the app, shown once to anyone starting out.
 *
 * It points at things that are really on the screen rather than describing
 * them in the abstract: each step finds its element, scrolls to it, lifts it
 * out of a dimmed page and puts a card beside it. A step whose element isn't
 * on screen is skipped rather than pointing at nothing.
 */
export const TOUR_KEY = "quran-tracker-tour";
export const tourSeen = () => {
  try { return localStorage.getItem(TOUR_KEY) === "done"; } catch { return true; }
};
export const markTourSeen = () => {
  try { localStorage.setItem(TOUR_KEY, "done"); } catch { /* storage blocked */ }
};

type Step = { find: string; title: string; body: string };

const STEPS: Step[] = [
  { find: ".juz-overview",
    title: "Start with any Juz",
    body: "Every Juz is here, and you can begin wherever you already are. Tap one to open its artwork." },
  { find: ".journey-strip",
    title: "Watch it fill up",
    body: "This grows as you go — books you have started, and Juz that are fully in your heart." },
  { find: ".memorizing-now",
    title: "What you're on right now",
    body: "Whatever you're learning gathers here, from every Juz, so you never lose your place. You can note the exact ayahs too." },
  { find: ".achievement-card",
    title: "Something to look forward to",
    body: "Little milestones along the way, ending with the Khatm al-Qur'an certificate when the whole Quran is in your heart." },
  { find: ".footer-backup",
    title: "Keep it safe",
    body: "Your progress lives on this device. Save a copy any time — it's how you move to a new phone without losing a thing." },
];

export default function Tour({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(-1);                     // -1 is the welcome card
  const [box, setBox] = useState<DOMRect | null>(null);

  const steps = STEPS.filter(s => document.querySelector(s.find));
  const step = i >= 0 ? steps[i] : null;

  useLayoutEffect(() => {
    if (!step) { setBox(null); return; }
    const el = document.querySelector(step.find);
    if (!el) { setBox(null); return; }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    // Let the smooth scroll land before measuring, or the hole sits in the
    // wrong place for a moment and it looks broken.
    const t = setTimeout(() => setBox(el.getBoundingClientRect()), 420);
    return () => clearTimeout(t);
  }, [i, step]);

  useEffect(() => {
    const again = () => { if (step) { const el = document.querySelector(step.find); if (el) setBox(el.getBoundingClientRect()); } };
    window.addEventListener("resize", again);
    return () => window.removeEventListener("resize", again);
  }, [step]);

  const finish = () => { markTourSeen(); onDone(); };
  const next = () => (i + 1 < steps.length ? setI(i + 1) : finish());

  // The card goes under the highlight when there is room, otherwise above it.
  const below = box ? box.bottom + 190 < window.innerHeight : true;
  const cardStyle: React.CSSProperties = box
    ? { top: below ? box.bottom + 14 : undefined, bottom: below ? undefined : window.innerHeight - box.top + 14 }
    : {};

  return <div className="tour" role="dialog" aria-modal="true" aria-label="A quick look around">
    {box && <div className="tour-hole" style={{
      top: box.top - 8, left: box.left - 8, width: box.width + 16, height: box.height + 16 }}/>}

    <div className={`tour-card ${box ? "anchored" : "middle"}`} style={cardStyle}>
      {step
        ? <>
            <p className="tour-count">{i + 1} of {steps.length}</p>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
            <div className="tour-buttons">
              <button className="tour-next" onClick={next}>{i + 1 === steps.length ? "Start memorizing" : "Next"}</button>
              <button className="tour-skip" onClick={finish}>Skip</button>
            </div>
          </>
        : <>
            <span className="tour-moon" aria-hidden="true">☾</span>
            <h2>As-salamu alaykum</h2>
            <p>Take thirty seconds and we'll show you around — there are only five things to see,
              and you can skip whenever you like.</p>
            <div className="tour-buttons">
              <button className="tour-next" onClick={() => setI(0)}>Show me around</button>
              <button className="tour-skip" onClick={finish}>I'll explore on my own</button>
            </div>
          </>}
    </div>
  </div>;
}
