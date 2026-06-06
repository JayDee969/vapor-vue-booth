import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, Share2, Camera, RotateCcw, Sparkles, Grid2x2, ChevronLeft, ChevronRight } from "lucide-react";
import { FILTERS, FRAMES, type FilterId, type FrameId, saveShot } from "@/lib/booth";
import { PhotoFrame } from "./PhotoFrame";
import { toast } from "sonner";

const SHOT_COUNTS = [1, 2, 3, 4, 6] as const;
type ShotCount = (typeof SHOT_COUNTS)[number];
const TIMER_OPTIONS = [0, 3, 5, 10] as const;
type TimerSeconds = (typeof TIMER_OPTIONS)[number];

const STRIP_BG: Record<FrameId, string> = {
  none: "#ffffff",
  polaroid: "#ffffff",
  filmstrip: "#171717",
  film35: "#f4ecdc",

  neon: "#0a0a0a",
  scrapbook: "#fdf6e3",
  cute: "#fbeaf2",
  modern: "#0a0a0a",
  vintage: "#efe2c4",
  minimalist: "#ffffff",
  kawaii: "#ffe4f1",
};

const STRIP_FG: Record<FrameId, string> = {
  none: "#3a2a45",
  polaroid: "#3a2a45",
  filmstrip: "#f5f5f5",
  film35: "#6b4a22",

  neon: "#ff6ad5",
  scrapbook: "#7a5a3a",
  cute: "#c4537a",
  modern: "#f5f5f5",
  vintage: "#6b4a22",
  minimalist: "#3a2a45",
  kawaii: "#c4537a",
};


export function PhotoBooth() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [filter, setFilter] = useState<FilterId>("none");
  const [frame, setFrame] = useState<FrameId>("polaroid");
  const [shotCount, setShotCount] = useState<ShotCount>(1);
  const [timerSeconds, setTimerSeconds] = useState<TimerSeconds>(3);
  const [result, setResult] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const filterCss = FILTERS.find((f) => f.id === filter)?.css ?? "none";

  // Callback ref re-attaches the existing MediaStream when the <video> element
  // is remounted (e.g. when switching frames swaps the wrapper DOM).
  const setVideoRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch (e) {
        console.error(e);
        setError("We couldn't access your camera. Check browser permissions and try again.");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // Capture the full video frame at its native resolution so the saved photo
  // keeps the camera's original aspect ratio — no cropping, no stretching.
  function captureFrame(): HTMLCanvasElement {
    const v = videoRef.current!;
    const outW = v.videoWidth;
    const outH = v.videoHeight;
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(outW, 0);
    ctx.scale(-1, 1);
    ctx.filter = filterCss;
    ctx.drawImage(v, 0, 0, outW, outH);
    return canvas;
  }


  async function runCountdown(seconds = 3) {
    for (let i = seconds; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 700));
    }
    setCountdown(null);
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
  }

  function composeFilm35(frames: HTMLCanvasElement[]): string {
    // Vintage 35mm contact-strip look: cream paper, black film body with
    // monospace side labels, photos stacked vertically in a single column.
    const cellW = 560;
    const cellH = 420;
    const gap = 10;
    const filmPadX = 48;
    const filmPadY = 36;
    const paperPadX = 70;
    const paperPadY = 70;
    const filmW = cellW + filmPadX * 2;
    const filmH = filmPadY * 2 + cellH * frames.length + gap * (frames.length - 1);
    const width = filmW + paperPadX * 2;
    const height = filmH + paperPadY * 2;

    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const ctx = out.getContext("2d")!;

    // Cream paper background with subtle horizontal grain
    ctx.fillStyle = "#f4ecdc";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(180,160,120,0.08)";
    for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1);

    // Black film body
    const fx = paperPadX;
    const fy = paperPadY;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(fx, fy, filmW, filmH);

    // Photos (contain-fit, no stretch)
    frames.forEach((c, i) => {
      const y = fy + filmPadY + i * (cellH + gap);
      const x = fx + filmPadX;
      const scale = Math.min(cellW / c.width, cellH / c.height);
      const dw = c.width * scale;
      const dh = c.height * scale;
      const dx = x + (cellW - dw) / 2;
      const dy = y + (cellH - dh) / 2;
      ctx.drawImage(c, dx, dy, dw, dh);
    });

    // Side labels — rotated monospace text down both edges of the film
    ctx.fillStyle = "rgba(245,240,225,0.75)";
    ctx.font = "16px 'Courier New', ui-monospace, monospace";
    const labels = ["TX 5063", "▸ 25A", "26", "TX 5063", "▸ 26A", "27"];
    frames.forEach((_, i) => {
      const y = fy + filmPadY + i * (cellH + gap) + cellH / 2;
      // left edge
      ctx.save();
      ctx.translate(fx + 22, y);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText(labels[i % labels.length], 0, 0);
      ctx.restore();
      // right edge
      ctx.save();
      ctx.translate(fx + filmW - 22, y);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText(labels[(i + 2) % labels.length], 0, 0);
      ctx.restore();
    });

    // Footer caption on the paper
    ctx.fillStyle = "#6b4a22";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "italic 22px 'Fraunces', Georgia, serif";
    ctx.fillText(`pose ♡ ${new Date().toLocaleDateString()}`, width / 2, height - paperPadY / 2);

    return out.toDataURL("image/jpeg", 0.92);
  }

  function composeStrip(frames: HTMLCanvasElement[]): string {
    if (frame === "film35") return composeFilm35(frames);

    const cols = frames.length >= 4 ? 2 : 1;
    const rows = Math.ceil(frames.length / cols);
    const cellW = 640;
    const cellH = 480;
    const gap = 20;
    const pad = 44;
    const footer = 90;
    const innerW = cellW * cols + gap * (cols - 1);
    const innerH = cellH * rows + gap * (rows - 1);
    const width = pad * 2 + innerW;
    const height = pad * 2 + innerH + footer;

    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const ctx = out.getContext("2d")!;

    // --- Outer background per frame ---
    const bg = STRIP_BG[frame];
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    if (frame === "vintage") {
      // Diagonal cream stripes
      ctx.save();
      ctx.strokeStyle = "#e8d8b3";
      ctx.lineWidth = 6;
      for (let d = -height; d < width + height; d += 12) {
        ctx.beginPath();
        ctx.moveTo(d, 0);
        ctx.lineTo(d + height, height);
        ctx.stroke();
      }
      ctx.restore();
      // Inner cream panel
      ctx.fillStyle = "#fbf2dc";
      ctx.fillRect(pad - 14, pad - 14, innerW + 28, innerH + 28);
      ctx.strokeStyle = "rgba(184,153,104,0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(pad - 14, pad - 14, innerW + 28, innerH + 28);
    } else if (frame === "neon") {
      // Neon gradient border
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#ff6ad5");
      grad.addColorStop(0.5, "#8c52ff");
      grad.addColorStop(1, "#26d0ce");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(20, 20, width - 40, height - 40);
    } else if (frame === "kawaii") {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#ffe4f1");
      grad.addColorStop(0.5, "#fff1c1");
      grad.addColorStop(1, "#d8f1ff");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (frame === "cute") {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "#fbeaf2");
      grad.addColorStop(1, "#e8d8f5");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(pad - 12, pad - 12, innerW + 24, innerH + 24);
    } else if (frame === "filmstrip") {
      // Sprocket holes top and bottom
      ctx.fillStyle = "#3a3a3a";
      const holeW = 22;
      const holeH = 14;
      const holeGap = 18;
      const holes = Math.floor(width / (holeW + holeGap));
      const startX = (width - (holes * (holeW + holeGap) - holeGap)) / 2;
      for (let i = 0; i < holes; i++) {
        const x = startX + i * (holeW + holeGap);
        ctx.fillRect(x, 10, holeW, holeH);
        ctx.fillRect(x, height - 24, holeW, holeH);
      }
    } else if (frame === "scrapbook") {
      // Tape stickers
      ctx.save();
      ctx.translate(pad - 8, pad - 8);
      ctx.rotate(-0.18);
      ctx.fillStyle = "rgba(253,224,71,0.8)";
      ctx.fillRect(0, 0, 100, 26);
      ctx.restore();
      ctx.save();
      ctx.translate(width - pad - 80, height - pad - 30);
      ctx.rotate(0.15);
      ctx.fillStyle = "rgba(251,182,206,0.8)";
      ctx.fillRect(0, 0, 90, 24);
      ctx.restore();
    }

    // --- Photos ---
    frames.forEach((c, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = pad + col * (cellW + gap);
      const y = pad + row * (cellH + gap);
      const scale = Math.min(cellW / c.width, cellH / c.height);
      const dw = c.width * scale;
      const dh = c.height * scale;
      const dx = x + (cellW - dw) / 2;
      const dy = y + (cellH - dh) / 2;

      // Per-photo decoration
      if (frame === "polaroid") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 12, y - 12, cellW + 24, cellH + 60);
      } else if (frame === "minimalist") {
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(x - 6, y - 6, cellW + 12, cellH + 12);
      } else if (frame === "modern") {
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(x - 10, y - 10, cellW + 20, cellH + 20);
      } else if (frame === "scrapbook") {
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 6, y - 6, cellW + 12, cellH + 12);
        ctx.setLineDash([]);
      } else if (frame === "kawaii") {
        ctx.strokeStyle = "#fbcfe8";
        ctx.lineWidth = 6;
        ctx.strokeRect(x - 4, y - 4, cellW + 8, cellH + 8);
      }

      ctx.drawImage(c, dx, dy, dw, dh);
    });

    // Footer label
    ctx.fillStyle = STRIP_FG[frame];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (frame === "vintage") {
      ctx.font = "italic 32px 'Fraunces', Georgia, serif";
      ctx.fillText(`est. mcmlxxiv · a fond memory`, width / 2, height - footer / 2);
    } else if (frame === "modern" || frame === "minimalist") {
      ctx.font = "600 22px 'Inter', sans-serif";
      const txt = frame === "modern" ? "POSE  ///  STUDIO" : `POSE  ·  ${new Date().getFullYear()}`;
      ctx.fillText(txt, width / 2, height - footer / 2);
    } else if (frame === "kawaii") {
      ctx.font = "italic 30px 'Fraunces', Georgia, serif";
      ctx.fillText("♡ so cute · so you ♡", width / 2, height - footer / 2);
    } else if (frame === "cute") {
      ctx.font = "600 22px 'Inter', sans-serif";
      ctx.fillText("♡ ⋆ ˚ POSE ˚ ⋆ ♡", width / 2, height - footer / 2);
    } else {
      ctx.font = "italic 34px 'Fraunces', Georgia, serif";
      ctx.fillText(`pose ♡ ${new Date().toLocaleDateString()}`, width / 2, height - footer / 2);
    }

    return out.toDataURL("image/jpeg", 0.92);
  }

  async function snap() {
    if (!videoRef.current || !ready) return;
    const frames: HTMLCanvasElement[] = [];

    if (shotCount === 1) {
      if (timerSeconds > 0) await runCountdown(timerSeconds);
      else {
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
      }
      frames.push(captureFrame());
    } else {
      for (let i = 0; i < shotCount; i++) {
        setProgress({ current: i + 1, total: shotCount });
        if (timerSeconds > 0) await runCountdown(timerSeconds);
        else {
          setFlash(true);
          await new Promise((r) => setTimeout(r, 200));
          setFlash(false);
        }
        frames.push(captureFrame());
        if (i < shotCount - 1) {
          await new Promise((r) => setTimeout(r, 350));
        }
      }
      setProgress(null);
    }

    // Always bake the chosen frame into the saved/downloaded image.
    const dataUrl = composeStrip(frames);
    setResult(dataUrl);
    saveShot({ id: crypto.randomUUID(), dataUrl, createdAt: Date.now(), filter, frame });
    toast.success(shotCount > 1 ? `${shotCount}-shot strip saved ✨` : "Saved to your gallery ✨");
  }

  function reset() {
    setResult(null);
  }

  function download() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `pose-${Date.now()}.jpg`;
    a.click();
  }

  async function share() {
    if (!result) return;
    try {
      const blob = await (await fetch(result)).blob();
      const file = new File([blob], "pose.jpg", { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Pose", text: "look what i made ♡" });
      } else {
        await navigator.clipboard.writeText(result);
        toast.success("Image copied to clipboard");
      }
    } catch (e) {
      console.error(e);
      toast.error("Couldn't share — try downloading instead.");
    }
  }

  const busy = countdown !== null || progress !== null;
  const isStrip = shotCount > 1;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* Stage */}
      <div className="flex flex-col items-center">
        <div className={`relative w-full ${isStrip && result ? "max-w-[460px]" : "max-w-[640px]"}`}>
          {result ? (
            <img
              src={result}
              alt="Your shot"
              className="w-full rounded-2xl shadow-[var(--shadow-soft)]"
            />
          ) : (
            <PhotoFrame frame={frame}>
              <video
                ref={setVideoRef}
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-contain [transform:scaleX(-1)]"
                style={{ filter: filterCss }}
              />

              {!ready && !error && (
                <div className="absolute inset-0 grid place-items-center bg-muted/60 text-sm text-muted-foreground">
                  Warming up the lens…
                </div>
              )}
              {error && (
                <div className="absolute inset-0 grid place-items-center bg-muted/80 p-6 text-center text-sm text-muted-foreground">
                  {error}
                </div>
              )}
              {progress && (
                <div className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                  Shot {progress.current} / {progress.total}
                </div>
              )}
              {countdown !== null && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="font-display text-[8rem] font-bold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)] animate-fade-in">
                    {countdown}
                  </span>
                </div>
              )}
              {flash && <div className="pointer-events-none absolute inset-0 bg-white animate-shutter" />}
            </PhotoFrame>
          )}
        </div>

        {/* Action bar */}
        <div className="mt-8 flex items-center gap-3">
          {result ? (
            <>
              <button
                onClick={reset}
                className="glass-panel flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium hover:scale-105 transition-transform"
              >
                <RotateCcw className="h-4 w-4" /> Retake
              </button>
              <button
                onClick={download}
                className="flex items-center gap-2 rounded-full bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-105 transition-transform"
              >
                <Download className="h-4 w-4" /> Download
              </button>
              <button
                onClick={share}
                className="glass-panel flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium hover:scale-105 transition-transform"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </>
          ) : (
            <button
              onClick={snap}
              disabled={!ready || busy}
              className="group relative grid h-20 w-20 place-items-center rounded-full bg-white shadow-[var(--shadow-soft)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              aria-label="Take photo"
            >
              <span className="absolute inset-1.5 rounded-full border-2 border-foreground/20" />
              <span className="h-14 w-14 rounded-full bg-[image:var(--gradient-primary)] transition-transform group-active:scale-90" />
              {shotCount > 1 && (
                <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background shadow">
                  ×{shotCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Side panel */}
      <aside className="glass-panel space-y-6 rounded-3xl p-6">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Grid2x2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Shots</h3>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {SHOT_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setShotCount(n)}
                disabled={busy}
                className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  shotCount === n
                    ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]"
                    : "bg-white/50 hover:bg-white/80"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {shotCount === 1
              ? "Single snap."
              : shotCount <= 3
                ? `${shotCount}-photo strip, stacked top to bottom.`
                : `${shotCount}-photo collage in a 2-column grid.`}
          </p>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Timer</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {TIMER_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setTimerSeconds(s)}
                disabled={busy}
                className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  timerSeconds === s
                    ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]"
                    : "bg-white/50 hover:bg-white/80"
                }`}
              >
                {s === 0 ? "Off" : `${s}s`}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {timerSeconds === 0
              ? "Instant capture, no countdown."
              : `${timerSeconds}-second countdown before each shot.`}
          </p>
        </div>

        <CardCarousel
          icon={<Sparkles className="h-4 w-4 text-primary" />}
          title="Filters"
          items={FILTERS.map((f) => ({ id: f.id, label: f.label }))}
          activeId={filter}
          onSelect={(id: string) => setFilter(id as FilterId)}
          renderCard={(it, isActive) => (
            <FilterCard id={it.id as FilterId} label={it.label} isActive={isActive} />
          )}
        />

        <CardCarousel
          icon={<Camera className="h-4 w-4 text-primary" />}
          title="Frames"
          items={FRAMES.map((f) => ({ id: f.id, label: f.label }))}
          activeId={frame}
          onSelect={(id: string) => setFrame(id as FrameId)}
          renderCard={(it, isActive) => (
            <FrameCard id={it.id as FrameId} label={it.label} isActive={isActive} />
          )}
        />
        {shotCount > 1 && (
          <p className="-mt-3 text-xs text-muted-foreground">
            The chosen frame styling is baked into your saved strip.
          </p>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          Tip: pick how many shots, hit the big button, and pose between countdowns. Strips save to your gallery as one image.
        </p>
      </aside>
    </div>
  );
}

const FILTER_SWATCH: Record<FilterId, string> = {
  none: "linear-gradient(135deg, #f5f5f5, #e0e0e0)",
  vintage: "linear-gradient(135deg, #d4a574, #8b6914)",
  bw: "linear-gradient(135deg, #888888, #333333)",
  glow: "linear-gradient(135deg, #ffd1dc, #ffb6c1)",
  pastel: "linear-gradient(135deg, #c1e1c1, #e8d8f5)",
  retro: "linear-gradient(135deg, #e8b84a, #c4654a)",
  blur: "linear-gradient(135deg, #b8d4e8, #d8c0e0)",
};

const FRAME_SWATCH: Record<FrameId, { bg: string; border: string; accent: string; style?: string }> = {
  none: { bg: "#ffffff", border: "#e5e5e5", accent: "#3a2a45" },
  polaroid: { bg: "#ffffff", border: "#f0f0f0", accent: "#3a2a45", style: "pb-3" },
  filmstrip: { bg: "#171717", border: "#2a2a2a", accent: "#f5f5f5" },
  film35: { bg: "#f4ecdc", border: "#e8dcc0", accent: "#6b4a22" },
  neon: { bg: "#0a0a0a", border: "#ff6ad5", accent: "#ff6ad5", style: "border-2 border-[#ff6ad5]" },
  scrapbook: { bg: "#fdf6e3", border: "#e8dcc0", accent: "#7a5a3a" },
  cute: { bg: "linear-gradient(135deg, #fbeaf2, #e8d8f5)", border: "#f0c0d8", accent: "#c4537a" },
  modern: { bg: "#0a0a0a", border: "#2a2a2a", accent: "#f5f5f5", style: "border-2 border-[#2a2a2a]" },
  vintage: { bg: "#efe2c4", border: "#d4c090", accent: "#6b4a22" },
  minimalist: { bg: "#ffffff", border: "#e5e5e5", accent: "#3a2a45", style: "border-2 border-[#e5e5e5]" },
  kawaii: { bg: "linear-gradient(135deg, #ffe4f1, #fff1c1, #d8f1ff)", border: "#f0c0d8", accent: "#c4537a" },
};

function CardCarousel({
  icon,
  title,
  items,
  activeId,
  onSelect,
  renderCard,
}: {
  icon: ReactNode;
  title: string;
  items: { id: string; label: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  renderCard: (it: { id: string; label: string }, isActive: boolean) => ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 160, behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scrollBy(-1)}
            aria-label={`Previous ${title.toLowerCase()}`}
            className="grid h-7 w-7 place-items-center rounded-full bg-white/70 text-foreground/70 transition hover:bg-white hover:scale-105"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label={`Next ${title.toLowerCase()}`}
            className="grid h-7 w-7 place-items-center rounded-full bg-white/70 text-foreground/70 transition hover:bg-white hover:scale-105"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onSelect(it.id)}
            className={`shrink-0 snap-start transition-all ${
              activeId === it.id
                ? "scale-[1.02]"
                : "opacity-80 hover:opacity-100 hover:scale-[1.02]"
            }`}
          >
            {renderCard(it, activeId === it.id)}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterCard({ id, label, isActive }: { id: FilterId; label: string; isActive: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 w-[120px]">
      <div
        className="h-[90px] w-full rounded-2xl shadow-sm"
        style={{ background: FILTER_SWATCH[id] }}
      />
      <span className={`text-xs font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}

function FrameCard({ id, label, isActive }: { id: FrameId; label: string; isActive: boolean }) {
  const swatch = FRAME_SWATCH[id];
  return (
    <div className="flex flex-col items-center gap-2 w-[120px]">
      <div
        className="h-[90px] w-full rounded-2xl shadow-sm flex items-center justify-center p-2"
        style={{ background: swatch.bg, border: `2px solid ${swatch.border}` }}
      >
        {/* Mini photo placeholder inside frame preview */}
        <div
          className="w-full h-full rounded-lg flex items-center justify-center"
          style={{
            background: id === "none" ? "#f0f0f0" : id === "polaroid" ? "#f8f8f8" : id === "modern" || id === "filmstrip" ? "#1a1a1a" : "#ffffff",
            border: id === "polaroid" ? "8px solid #fff" : id === "minimalist" ? "1px solid #ddd" : undefined,
            paddingBottom: id === "polaroid" ? "16px" : undefined,
          }}
        >
          <Camera className="h-5 w-5" style={{ color: swatch.accent, opacity: 0.3 }} />
        </div>
      </div>
      <span className={`text-xs font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}
