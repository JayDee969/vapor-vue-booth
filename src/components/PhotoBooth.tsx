import { useEffect, useRef, useState } from "react";
import { Download, Share2, Camera, RotateCcw, Sparkles, Grid2x2 } from "lucide-react";
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
    const gap = 16;
    const pad = 28;
    const footer = 80;
    const width = pad * 2 + cellW * cols + gap * (cols - 1);
    const height = pad * 2 + cellH * rows + gap * (rows - 1) + footer;

    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const ctx = out.getContext("2d")!;

    ctx.fillStyle = STRIP_BG[frame];
    ctx.fillRect(0, 0, width, height);

    frames.forEach((c, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = pad + col * (cellW + gap);
      const y = pad + row * (cellH + gap);
      // Fit the captured frame into its cell preserving aspect ratio (no stretch).
      const scale = Math.min(cellW / c.width, cellH / c.height);
      const dw = c.width * scale;
      const dh = c.height * scale;
      const dx = x + (cellW - dw) / 2;
      const dy = y + (cellH - dh) / 2;
      ctx.drawImage(c, dx, dy, dw, dh);
    });


    // Footer label
    ctx.fillStyle = STRIP_FG[frame];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "italic 36px 'Fraunces', Georgia, serif";
    const label = `pose ♡ ${new Date().toLocaleDateString()}`;
    ctx.fillText(label, width / 2, height - footer / 2);

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
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Filters</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                  filter === f.id
                    ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]"
                    : "bg-white/50 hover:bg-white/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Frames</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FRAMES.map((f) => (
              <button
                key={f.id}
                onClick={() => setFrame(f.id)}
                className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                  frame === f.id
                    ? "bg-foreground text-background shadow-[var(--shadow-soft)]"
                    : "bg-white/50 hover:bg-white/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {shotCount > 1 && (
            <p className="mt-2 text-xs text-muted-foreground">
              For strips, the frame color tints your photo strip background.
            </p>
          )}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Tip: pick how many shots, hit the big button, and pose between countdowns. Strips save to your gallery as one image.
        </p>
      </aside>
    </div>
  );
}
