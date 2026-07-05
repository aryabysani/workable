"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type HeroSlide = { src: string; alt: string };

/** Cross-fading hero image carousel that advances once per second. */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 1000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div className="relative overflow-hidden border border-border rounded-[20px] aspect-[4/3] shadow-[0_1px_2px_rgba(35,32,27,0.04),0_12px_28px_-12px_rgba(35,32,27,0.22)]">
      {slides.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          sizes="(max-width: 1024px) 100vw, 40vw"
          className={`object-cover transition-opacity duration-700 ease-in-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Scrim for quote legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(35,32,27,0.78) 0%, rgba(35,32,27,0.25) 38%, transparent 62%)",
        }}
      />

      <p className="absolute inset-x-0 bottom-0 px-7 pb-6 text-center font-serif italic text-lg text-[#f7f3ea] leading-relaxed drop-shadow-sm">
        &ldquo;Everyone deserves a doorway to good work.&rdquo;
      </p>

      {/* Progress dots */}
      <div className="absolute top-4 right-4 flex gap-1.5">
        {slides.map((slide, i) => (
          <span
            key={slide.src}
            aria-hidden="true"
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === active ? "w-5 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
