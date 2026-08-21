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

type Step = {
  find: string;
  title: string;
  body: string;
  /** Run before this step looks for its element. The steps that live inside
   *  a Juz or the practice page, rather than on the plain home screen, need
   *  the app switched there first — and several practice steps also need a
   *  specific bit of practice state already set (a book's dialog open, bulk
   *  mode on, the certificate showing) so there's something concrete on
   *  screen rather than bare artwork. */
  before?: "juz" | "home" | "practiceStatus" | "practiceBulk" | "practiceCert";
};

const STEPS: Step[] = [
  { find: ".juz-overview",
    title: "Start with any Juz",
    body: "Every Juz is here, and you can begin wherever you already are. Tap one to open its artwork." },
  { find: ".journey-strip",
    title: "Watch it fill up",
    body: "This grows as you go — books you have started, and Juz that are fully in your heart." },
  { find: ".memorizing-now",
    title: "What you're carrying right now",
    body: "Whatever you're learning gathers here, from every Juz, so you never lose your place." },
  { find: ".current-work",
    title: "Note the exact ayahs",
    body: "Open any Juz and whatever you're learning gets its own line here — jot the exact ayahs so you always know exactly where you left off.",
    before: "juz" },
  { find: ".status-dialog",
    title: "Try marking a status",
    body: "This is a practice page — nothing here is saved. Al-Fatiha is already open below — choose how it's going, or tap “I haven't started this yet” and pick a different practice book instead.",
    before: "practiceStatus" },
  { find: ".tour-practice .bulk-bar",
    title: "Try marking several at once",
    body: "Pick a book or two in the practice artwork above, then choose one status for all of them here.",
    before: "practiceBulk" },
  { find: ".practice-certificate",
    title: "Preview the certificate",
    body: "All three practice books are now “It's in my heart” — here's what the certificate looks like once a Juz is finished for real.",
    before: "practiceCert" },
  { find: ".practice-certificate .cert-honorific",
    title: "Hafiz or Hafizah",
    body: "And right here — a small toggle for how the finished certificate reads: Hafizah or Hafiz. It's the same toggle you'll set for real the first time you rename a reciter.",
    before: "practiceCert" },
  { find: ".achievement-card",
    title: "Something to look forward to",
    body: "Little milestones along the way, ending with the Khatm al-Qur'an certificate when the whole Quran is in your heart.",
    before: "home" },
  { find: ".footer-backup",
    title: "Keep it safe",
    body: "Your progress lives on this device, and travels to your other devices once you have a licence key. Save a copy any time too — it's the one that works from day one, key or not." },
];

export default function Tour({ onDone, openJuz, goHome, startPracticeStatus, startPracticeBulk, startPracticeCert, tourJuz }: {
  onDone: () => void;
  openJuz: (n: number) => void;
  goHome: () => void;
  /** Practice page on, with Al-Fatiha's status dialog already open. */
  startPracticeStatus: () => void;
  /** Practice page on, with multi-select already switched on. */
  startPracticeBulk: () => void;
  /** Practice page on, all three books already marked "in my heart," and the
   *  certificate preview already open. */
  startPracticeCert: () => void;
  tourJuz: number;
}) {
  const [i, setI] = useState(-1);                     // -1 is the welcome card
  const [box, setBox] = useState<DOMRect | null>(null);

  /**
   * Worked out once, at the moment the tour opens, and never again. Two steps
   * now navigate the app to show what they're pointing at — recomputing this
   * on every render, from whatever's in the DOM right now, used to make the
   * list shrink the instant one of those steps navigated away from the home
   * screen, which shoved every later index out from under it and made the
   * tour skip and repeat steps. A step with `before` isn't on screen yet at
   * this first look either — trust that its own navigation will put it there.
   */
  const [steps] = useState(() => STEPS.filter(s => s.before || document.querySelector(s.find)));
  const step = i >= 0 ? steps[i] : null;

  useLayoutEffect(() => {
    if (!step) { setBox(null); return; }
    let cancelled = false;
    if (step.before === "juz") openJuz(tourJuz);
    if (step.before === "home") goHome();
    if (step.before === "practiceStatus") startPracticeStatus();
    if (step.before === "practiceBulk") startPracticeBulk();
    if (step.before === "practiceCert") startPracticeCert();

    (async () => {
      // Give the app a moment to navigate and re-render before looking for
      // the element — skipped entirely for steps already on screen.
      if (step.before) await new Promise(r => setTimeout(r, 60));
      if (cancelled) return;
      const el = document.querySelector(step.find);
      if (!el) { setBox(null); return; }
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      // Let the smooth scroll land before measuring, or the hole sits in the
      // wrong place for a moment and it looks broken.
      await new Promise(r => setTimeout(r, 420));
      if (cancelled) return;
      setBox(el.getBoundingClientRect());
    })();

    return () => { cancelled = true; };
  }, [i, step]);

  useEffect(() => {
    const again = () => { if (step) { const el = document.querySelector(step.find); if (el) setBox(el.getBoundingClientRect()); } };
    window.addEventListener("resize", again);
    return () => window.removeEventListener("resize", again);
  }, [step]);

  // Skipping mid-tour, from inside the Juz the ayah-notes step opened, would
  // otherwise strand somebody there instead of back on the home screen.
  const finish = () => { markTourSeen(); goHome(); onDone(); };
  const next = () => (i + 1 < steps.length ? setI(i + 1) : finish());

  /**
   * The card goes under the highlight when there's room, otherwise above it —
   * but a highlighted *section* (".juz-overview" is 30 tiles tall) can easily
   * be taller than the window itself, in which case neither "below" nor
   * "above" leaves anywhere real to put it, and the old bottom-anchored math
   * for "above" had nothing stopping it from landing the card partly above
   * row 0 of the page, invisible above the fold. Always clamped into the
   * visible window now, on a rough card-height guess — a little off-center
   * from the highlight beats not being on screen at all.
   */
  const CARD_ESTIMATE = 240;
  const MARGIN = 12;
  let cardTop: number | null = null;
  if (box) {
    const below = box.bottom + 14 + CARD_ESTIMATE < window.innerHeight;
    const raw = below ? box.bottom + 14 : box.top - CARD_ESTIMATE - 14;
    cardTop = Math.max(MARGIN, Math.min(raw, window.innerHeight - CARD_ESTIMATE - MARGIN));
  }
  const cardStyle: React.CSSProperties = cardTop === null ? {} : { top: cardTop };

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
            <p>Take a minute and we'll show you around — {steps.length} things to see,
              and you can skip whenever you like.</p>
            <div className="tour-buttons">
              <button className="tour-next" onClick={() => setI(0)}>Show me around</button>
              <button className="tour-skip" onClick={finish}>I'll explore on my own</button>
            </div>
          </>}
    </div>
  </div>;
}
