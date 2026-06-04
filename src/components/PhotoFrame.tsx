import type { FrameId } from "@/lib/booth";
import type { ReactNode } from "react";

/**
 * Wraps a media element (video/img) with a decorative frame.
 * The inner area is a 4:3 box; media inside should use object-contain
 * (set by the caller) so original aspect ratios are preserved.
 */
export function PhotoFrame({ frame, children }: { frame: FrameId; children: ReactNode }) {
  if (frame === "polaroid") {
    return (
      <div className="rounded-md bg-white p-4 pb-16 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] rotate-[-1deg]">
        <div className="relative aspect-[4/3] overflow-hidden bg-black">{children}</div>
        <p className="mt-4 text-center font-display text-lg italic text-foreground/70">pose ♡</p>
      </div>
    );
  }
  if (frame === "filmstrip") {
    return (
      <div className="rounded-lg bg-neutral-900 p-3 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between px-1 py-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="h-3 w-4 rounded-sm bg-neutral-700" />
          ))}
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-black">{children}</div>
        <div className="flex items-center justify-between px-1 py-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="h-3 w-4 rounded-sm bg-neutral-700" />
          ))}
        </div>
      </div>
    );
  }
  if (frame === "neon") {
    return (
      <div
        className="rounded-2xl p-1.5"
        style={{
          background: "linear-gradient(135deg,#ff6ad5,#8c52ff,#26d0ce,#ff6ad5)",
          boxShadow: "0 0 40px rgba(255,106,213,.55), 0 0 80px rgba(140,82,255,.4)",
        }}
      >
        <div className="rounded-xl bg-neutral-950 p-1">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black">{children}</div>
        </div>
      </div>
    );
  }
  if (frame === "scrapbook") {
    return (
      <div className="relative rounded-md bg-[#fdf6e3] p-5 shadow-[var(--shadow-soft)] rotate-[1deg]">
        <span className="absolute -left-2 -top-2 h-6 w-16 rotate-[-12deg] bg-yellow-200/80" />
        <span className="absolute -right-2 -bottom-2 h-6 w-14 rotate-[8deg] bg-pink-200/80" />
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm border-2 border-dashed border-foreground/20 bg-white">
          {children}
        </div>
        <p className="mt-3 text-center font-display text-base text-foreground/60">— a little moment —</p>
      </div>
    );
  }
  if (frame === "cute") {
    return (
      <div className="rounded-[2rem] p-3" style={{ background: "var(--gradient-soft)" }}>
        <div className="rounded-[1.5rem] bg-white p-2 shadow-inner">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.2rem] bg-white">{children}</div>
        </div>
        <p className="py-2 text-center text-xs tracking-[0.3em] text-muted-foreground">♡ ⋆ ˚ POSE ˚ ⋆ ♡</p>
      </div>
    );
  }
  if (frame === "modern") {
    return (
      <div className="rounded-2xl bg-neutral-950 p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
          {children}
        </div>
        <div className="mt-3 flex items-center justify-between px-1 text-[10px] uppercase tracking-[0.4em] text-white/60">
          <span>pose</span>
          <span>///</span>
          <span>studio</span>
        </div>
      </div>
    );
  }
  if (frame === "vintage") {
    return (
      <div
        className="rounded-sm p-6 shadow-[var(--shadow-soft)]"
        style={{
          background:
            "repeating-linear-gradient(45deg,#efe2c4 0 6px,#e8d8b3 6px 12px)",
        }}
      >
        <div className="rounded-sm bg-[#fbf2dc] p-3 ring-1 ring-[#b89968]/40">
          <div className="relative aspect-[4/3] overflow-hidden bg-[#1a120a] ring-1 ring-[#7a5a2a]/50">
            {children}
          </div>
          <p className="mt-3 text-center font-display text-sm italic tracking-wide text-[#6b4a22]">
            est. mcmlxxiv · a fond memory
          </p>
        </div>
      </div>
    );
  }
  if (frame === "minimalist") {
    return (
      <div className="bg-white p-3 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.18)] ring-1 ring-foreground/5">
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">{children}</div>
        <div className="mt-3 flex items-center justify-between px-0.5 text-[10px] uppercase tracking-[0.35em] text-foreground/50">
          <span>pose</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </div>
    );
  }
  if (frame === "kawaii") {
    return (
      <div
        className="rounded-[2rem] p-4"
        style={{
          background: "linear-gradient(135deg,#ffe4f1,#fff1c1,#d8f1ff)",
          boxShadow: "0 20px 60px -20px rgba(255,150,200,0.45)",
        }}
      >
        <div className="absolute -mt-6 ml-2 text-2xl select-none">🌸</div>
        <div className="relative rounded-[1.6rem] bg-white p-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.3rem] bg-white ring-2 ring-pink-200">
            {children}
          </div>
        </div>
        <p className="py-2 text-center font-display text-sm text-pink-500/80">♡ so cute · so you ♡</p>
      </div>
    );
  }
  return (
    <div className="glass-panel rounded-3xl p-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black/5">{children}</div>
    </div>
  );
}
