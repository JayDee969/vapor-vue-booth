import { useEffect, useRef, useState } from "react";
import { Download, Share2, Camera, RotateCcw, Sparkles, Grid2x2 } from "lucide-react";
import { FILTERS, FRAMES, type FilterId, type FrameId, saveShot } from "@/lib/booth";
import { PhotoFrame } from "./PhotoFrame";
import { toast } from "sonner";

const SHOT_COUNTS = [1, 2, 3, 4, 6] as const;
type ShotCount = (typeof SHOT_COUNTS)[number];

const STRIP_BG: Record<FrameId, string> = {
  none: "#ffffff",
  polaroid: "#ffffff",
  filmstrip: "#171717",
  neon: "#0a0a0a",
  scrapbook: "#fdf6e3",
  cute: "#fbeaf2",
};

const STRIP_FG: Record<FrameId, string> = {
  none: "#3a2a45",
  polaroid: "#3a2a45",
  filmstrip: "#f5f5f5",
  neon: "#ff6ad5",
  scrapbook: "#7a5a3a",
  cute: "#c4537a",
};

export function PhotoBooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [filter, setFilter] = useState<FilterId>("none");
  const [frame, setFrame] = useState<FrameId>("polaroid");
  const [shotCount, setShotCount] = useState<ShotCount>(1);
  const [result, setResult] = useState<string | null>(null);
  const [isStrip, setIsStrip] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const filterCss = FILTERS.find((f) => f.id === filter)?.css ?? "none";

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e) {
        console.error(e);
        setError("We couldn't access your camera. Check browser permissions and try again.");
      }
    })();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function captureFrame(): HTMLCanvasElement {
    const v = videoRef.current!;
    const w = v.videoWidth;
    const h = v.videoHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.filter = filterCss;
    ctx.drawImage(v, 0, 0, w, h);
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

  function composeStrip(frames: HTMLCanvasElement[]): string {
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
      ctx.drawImage(c, x, y, cellW, cellH);
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
      await runCountdown(3);
      frames.push(captureFrame());
    } else {
      for (let i = 0; i < shotCount; i++) {
        setProgress({ current: i + 1, total: shotCount });
        await runCountdown(i === 0 ? 3 : 2);
        frames.push(captureFrame());
        if (i < shotCount - 1) {
          await new Promise((r) => setTimeout(r, 350));
        }
      }
      setProgress(null);
    }

    const dataUrl = shotCount === 1 ? frames[0].toDataURL("image/jpeg", 0.92) : composeStrip(frames);
    setResult(dataUrl);
    setIsStrip(shotCount > 1);
    saveShot({ id: crypto.randomUUID(), dataUrl, createdAt: Date.now(), filter, frame });
    toast.success(shotCount > 1 ? `${shotCount}-shot strip saved ✨` : "Saved to your gallery ✨");
  }

  function reset() {
    setResult(null);
    setIsStrip(false);
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

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* Stage */}
      <div className="flex flex-col items-center">
        <div className={`relative w-full ${isStrip && result ? "max-w-[420px]" : "max-w-[640px]"}`}>
          {result ? (
            isStrip ? (
              <img
                src={result}
                alt="Your photo strip"
                className="w-full rounded-3xl shadow-[var(--shadow-soft)]"
              />
            ) : (
              <PhotoFrame frame={frame}>
                <img src={result} alt="Your shot" className="h-full w-full object-cover" />
              </PhotoFrame>
            )
          ) : (
            <PhotoFrame frame={frame}>
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover [transform:scaleX(-1)]"
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
