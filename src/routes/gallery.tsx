import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { useEffect, useState } from "react";
import { loadGallery, deleteShot, type Shot } from "@/lib/booth";
import { Download, Trash2, Camera } from "lucide-react";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Pose" },
      { name: "description", content: "Every shot you've taken, in one cozy place." },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const [shots, setShots] = useState<Shot[]>([]);

  useEffect(() => {
    setShots(loadGallery());
  }, []);

  function remove(id: string) {
    deleteShot(id);
    setShots(loadGallery());
  }

  function download(s: Shot) {
    const a = document.createElement("a");
    a.href = s.dataUrl;
    a.download = `pose-${s.id}.jpg`;
    a.click();
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
              your <span className="text-gradient">gallery</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Saved locally on this device. {shots.length} shot{shots.length === 1 ? "" : "s"}.</p>
          </div>
          <Link
            to="/booth"
            className="flex items-center gap-2 rounded-full bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-105"
          >
            <Camera className="h-4 w-4" /> New shot
          </Link>
        </div>

        {shots.length === 0 ? (
          <div className="glass-panel grid place-items-center rounded-3xl p-16 text-center">
            <p className="font-display text-2xl">nothing here yet ✿</p>
            <p className="mt-2 text-sm text-muted-foreground">Take your first photo to start your gallery.</p>
            <Link
              to="/booth"
              className="mt-6 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:scale-105"
            >
              Open the booth
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {shots.map((s) => (
              <div key={s.id} className="glass-panel group relative overflow-hidden rounded-2xl p-2">
                <img src={s.dataUrl} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
                <div className="flex items-center justify-between px-2 py-2 text-xs text-muted-foreground">
                  <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => download(s)}
                      className="rounded-full bg-white/80 p-1.5 hover:bg-white"
                      aria-label="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="rounded-full bg-white/80 p-1.5 hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
