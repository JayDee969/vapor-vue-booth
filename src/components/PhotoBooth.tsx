import { useEffect, useRef, useState } from "react";
import { Download, Share2, Camera, RotateCcw, Sparkles } from "lucide-react";
import { FILTERS, FRAMES, type FilterId, type FrameId, saveShot } from "@/lib/booth";
import { PhotoFrame } from "./PhotoFrame";
import { toast } from "sonner";

export function PhotoBooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [filter, setFilter] = useState<FilterId>("none");
  const [frame, setFrame] = useState<FrameId>("polaroid");
  const [shot, setShot] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

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

  async function snap() {
    if (!videoRef.current || !ready) return;
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 700));
    }
    setCountdown(null);
    setFlash(true);
    setTimeout(() => setFlash(false), 500);

    const v = videoRef.current;
    const w = v.videoWidth;
    const h = v.videoHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    // Mirror to match preview
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.filter = filterCss;
    ctx.drawImage(v, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setShot(dataUrl);
    saveShot({ id: crypto.randomUUID(), dataUrl, createdAt: Date.now(), filter, frame });
    toast.success("Saved to your gallery ✨");
  }

  function download() {
    if (!shot) return;
    const a = document.createElement("a");
    a.href = shot;
    a.download = `pose-${Date.now()}.jpg`;
    a.click();
  }

  async function share() {
    if (!shot) return;
    try {
      const blob = await (await fetch(shot)).blob();
      const file = new File([blob], "pose.jpg", { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Pose", text: "look what i made ♡" });
      } else {
        await navigator.clipboard.writeText(shot);
        toast.success("Image copied to clipboard");
      }
    } catch (e) {
      console.error(e);
      toast.error("Couldn't share — try downloading instead.");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* Stage */}
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[640px]">
          <PhotoFrame frame={frame}>
            {shot ? (
              <img src={shot} alt="Your shot" className="h-full w-full object-cover" />
            ) : (
              <>
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
                {countdown !== null && (
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <span className="font-display text-[8rem] font-bold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)] animate-fade-in">
                      {countdown}
                    </span>
                  </div>
                )}
                {flash && <div className="pointer-events-none absolute inset-0 bg-white animate-shutter" />}
              </>
            )}
          </PhotoFrame>
        </div>

        {/* Action bar */}
        <div className="mt-8 flex items-center gap-3">
          {shot ? (
            <>
              <button
                onClick={() => setShot(null)}
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
              disabled={!ready || countdown !== null}
              className="group relative grid h-20 w-20 place-items-center rounded-full bg-white shadow-[var(--shadow-soft)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              aria-label="Take photo"
            >
              <span className="absolute inset-1.5 rounded-full border-2 border-foreground/20" />
              <span className="h-14 w-14 rounded-full bg-[image:var(--gradient-primary)] transition-transform group-active:scale-90" />
            </button>
          )}
        </div>
      </div>

      {/* Side panel */}
      <aside className="glass-panel space-y-6 rounded-3xl p-6">
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
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Tip: pick a filter + frame combo, then hit the big button. Your shots auto-save to your local gallery.
        </p>
      </aside>
    </div>
  );
}
