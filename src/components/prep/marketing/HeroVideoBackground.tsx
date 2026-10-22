"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  poster: string;
  /** Overlay strength on top of the footage, 0..1. */
  shade?: number;
};

/**
 * Full-bleed background footage for the hero. The poster is painted first and
 * stays for reduced-motion viewers and when autoplay is refused; the video
 * fades in once it can play. Decorative: no controls, no audio, no alt.
 */
export function HeroVideoBackground({ src, poster, shade = 0.72 }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) setAllowed(true);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v || !allowed) return;
    const onPlaying = () => setReady(true);
    v.addEventListener("playing", onPlaying);
    v.play().catch(() => setReady(false));
    return () => v.removeEventListener("playing", onPlaying);
  }, [allowed]);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-primary">
      {/* eslint-disable-next-line @next/next/no-img-element -- full-bleed poster, sized by CSS */}
      <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {allowed ? (
        <video
          ref={ref}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: ready ? 1 : 0 }}
        />
      ) : null}
      <div className="absolute inset-0" style={{ background: `rgba(15, 35, 71, ${shade})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-primary/30" />
    </div>
  );
}
