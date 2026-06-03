import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Camera, Sparkles, ImageIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pose — Aesthetic Browser Photo Booth" },
      { name: "description", content: "Take dreamy selfies in your browser. Filters, frames, vibes." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 pt-20 pb-24 text-center">
        <span className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> new — neon glow frame is live
        </span>
        <h1 className="mt-6 font-display text-6xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
          your little<br />
          <span className="text-gradient">photo booth</span>, anywhere.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Snap selfies, drop a soft filter, frame it cute. No app, no signup — just open your camera and pose.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/booth"
            className="flex items-center gap-2 rounded-full bg-[image:var(--gradient-primary)] px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-105"
          >
            <Camera className="h-4 w-4" /> Take a photo
          </Link>
          <Link
            to="/gallery"
            className="glass-panel flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-transform hover:scale-105"
          >
            <ImageIcon className="h-4 w-4" /> View gallery
          </Link>
        </div>

        <div className="mt-24 grid gap-4 text-left md:grid-cols-3">
          {[
            { t: "6 dreamy filters", d: "Vintage, B&W, soft glow, pastel, retro film, aesthetic blur." },
            { t: "5 cute frames", d: "Polaroid, film strip, neon glow, scrapbook, cute borders." },
            { t: "Private by default", d: "Everything stays in your browser. Nothing uploaded." },
          ].map((c) => (
            <div key={c.t} className="glass-panel rounded-3xl p-6">
              <h3 className="font-display text-xl font-semibold">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
