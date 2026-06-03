import { Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";

const linkBase =
  "px-4 py-2 rounded-full text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-white/40";
const activeCls = "!text-foreground !bg-white/70 shadow-sm";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <nav className="glass-panel mx-auto flex max-w-5xl items-center justify-between rounded-full px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
            <Camera className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">pose</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link to="/" activeOptions={{ exact: true }} className={linkBase} activeProps={{ className: activeCls }}>
            Home
          </Link>
          <Link to="/booth" className={linkBase} activeProps={{ className: activeCls }}>
            Take Photo
          </Link>
          <Link to="/gallery" className={linkBase} activeProps={{ className: activeCls }}>
            Gallery
          </Link>
        </div>
      </nav>
    </header>
  );
}
