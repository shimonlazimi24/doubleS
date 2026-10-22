"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  poster: string;
  /** Silent loop; null renders the still image only. */
  video: string | null;
  width: number;
  height: number;
  alt: string;
  priority?: boolean;
};

/**
 * The still image renders on the server and stays for anyone who prefers
 * reduced motion or whose browser blocks autoplay. The video is swapped in
 * after mount, so it never delays the first paint.
 */
export function HeroMedia({ poster, video, width, height, alt, priority = false }: Props) {
  const [playVideo, setPlayVideo] = useState(false);

  useEffect(() => {
    if (!video) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) setPlayVideo(true);
  }, [video]);

  if (video && playVideo) {
    return (
      <video
        src={video}
        poster={poster}
        width={width}
        height={height}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
        className="block h-auto w-full"
        onError={() => setPlayVideo(false)}
      />
    );
  }
  return (
    <Image
      src={poster}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes="(min-width: 1024px) 560px, 100vw"
      className="h-auto w-full"
    />
  );
}
