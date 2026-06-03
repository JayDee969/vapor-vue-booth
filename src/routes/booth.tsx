import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { PhotoBooth } from "@/components/PhotoBooth";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/booth")({
  head: () => ({
    meta: [
      { title: "Take a Photo — Pose" },
      { name: "description", content: "Step into the booth. Pick a filter, a frame, and pose." },
    ],
  }),
  component: BoothPage,
});

function BoothPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
            say <span className="text-gradient">cheese</span> ♡
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">A 3-second countdown gives you time to pose.</p>
        </div>
        <PhotoBooth />
      </main>
      <Toaster position="top-center" />
    </div>
  );
}
