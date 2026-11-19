"use client";

import Image from "next/image";
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
export function HeroVideoBackground({ src, poster, shade = 0.86 }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Phones get the poster only: the footage is several MB on a mobile
    // connection, behind a shade that hides most of it anyway.
    const wide = window.matchMedia("(min-width: 768px)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (!reduced && wide && !saveData) setAllowed(true);
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
      {/* Through next/image: the poster is the first large paint on a phone, and the raw file is 170KB. */}
      <Image src={poster} alt="" fill priority sizes="100vw" quality={60} className="scale-105 object-cover blur-[3px]" />
      {allowed ? (
        <video
          ref={ref}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full scale-105 object-cover blur-[3px] transition-opacity duration-700"
          style={{ opacity: ready ? 1 : 0 }}
        />
      ) : null}
      <div className="absolute inset-0" style={{ background: `rgba(15, 35, 71, ${shade})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-primary/30" />
    </div>
  );
}
