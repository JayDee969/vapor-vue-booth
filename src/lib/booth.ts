export type FilterId = "none" | "vintage" | "bw" | "glow" | "pastel" | "retro" | "blur";
export type FrameId =
  | "none"
  | "polaroid"
  | "filmstrip"
  | "neon"
  | "scrapbook"
  | "cute"
  | "modern"
  | "vintage"
  | "minimalist"
  | "kawaii";

export const FILTERS: { id: FilterId; label: string; css: string }[] = [
  { id: "none", label: "Original", css: "none" },
  { id: "vintage", label: "Vintage", css: "sepia(0.45) contrast(1.05) saturate(1.1) brightness(1.02)" },
  { id: "bw", label: "B&W", css: "grayscale(1) contrast(1.1)" },
  { id: "glow", label: "Soft Glow", css: "brightness(1.08) contrast(0.95) saturate(1.1) blur(0.3px)" },
  { id: "pastel", label: "Pastel", css: "saturate(0.75) brightness(1.08) hue-rotate(-8deg) contrast(0.95)" },
  { id: "retro", label: "Retro Film", css: "sepia(0.3) saturate(1.4) contrast(1.15) hue-rotate(-10deg)" },
  { id: "blur", label: "Aesthetic Blur", css: "blur(1.2px) saturate(1.15) brightness(1.05)" },
];

export const FRAMES: { id: FrameId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "polaroid", label: "Polaroid" },
  { id: "filmstrip", label: "Film Strip" },
  { id: "neon", label: "Neon Glow" },
  { id: "scrapbook", label: "Scrapbook" },
  { id: "cute", label: "Cute Border" },
  { id: "modern", label: "Modern" },
  { id: "vintage", label: "Vintage" },
  { id: "minimalist", label: "Minimalist" },
  { id: "kawaii", label: "Kawaii" },
];

const KEY = "pose.gallery.v1";

export type Shot = { id: string; dataUrl: string; createdAt: number; filter: FilterId; frame: FrameId };

export function loadGallery(): Shot[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveShot(shot: Shot) {
  const all = loadGallery();
  all.unshift(shot);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 60)));
}

export function deleteShot(id: string) {
  localStorage.setItem(KEY, JSON.stringify(loadGallery().filter((s) => s.id !== id)));
}
