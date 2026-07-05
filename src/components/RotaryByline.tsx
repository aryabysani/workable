import Image from "next/image";

/** Rotary horizontal wordmark — co-brand lockup for light backgrounds (headers). */
export function RotaryByline({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span className="w-px h-7 bg-border" aria-hidden="true" />
      <Image
        src="/rotary-wordmark.png"
        alt="A Rotary International initiative"
        width={288}
        height={108}
        className="h-[22px] w-auto"
        priority
      />
    </span>
  );
}

/** Rotary gear mark — solid gold roundel that reads well on dark backgrounds (footer). */
export function RotaryMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/rotary-mark.png"
      alt="Rotary International"
      width={size}
      height={size}
      className={className}
    />
  );
}
