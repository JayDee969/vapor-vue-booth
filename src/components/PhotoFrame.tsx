import type { FrameId } from "@/lib/booth";
import type { ReactNode } from "react";

/**
 * Wraps a media element (video/img) with a decorative frame.
 * The inner area is always a 4:3 box.
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
        <div className="relative aspect-[4/3] overflow-hidden">{children}</div>
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
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">{children}</div>
        </div>
      </div>
    );
  }
  if (frame === "scrapbook") {
    return (
      <div className="relative rounded-md bg-[#fdf6e3] p-5 shadow-[var(--shadow-soft)] rotate-[1deg]">
        <span className="absolute -left-2 -top-2 h-6 w-16 rotate-[-12deg] bg-yellow-200/80" />
        <span className="absolute -right-2 -bottom-2 h-6 w-14 rotate-[8deg] bg-pink-200/80" />
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm border-2 border-dashed border-foreground/20">
          {children}
        </div>
        <p className="mt-3 text-center font-display text-base text-foreground/60">— a little moment —</p>
      </div>
    );
  }
  if (frame === "cute") {
    return (
      <div
        className="rounded-[2rem] p-3"
        style={{ background: "var(--gradient-soft)" }}
      >
        <div className="rounded-[1.5rem] bg-white p-2 shadow-inner">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.2rem]">{children}</div>
        </div>
        <p className="py-2 text-center text-xs tracking-[0.3em] text-muted-foreground">♡ ⋆ ˚ POSE ˚ ⋆ ♡</p>
      </div>
    );
  }
  return (
    <div className="glass-panel rounded-3xl p-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">{children}</div>
    </div>
  );
}
