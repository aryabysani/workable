/** WorkAble wordmark. */
export function Logo({
  textSize = "text-[21px]",
  className = "",
}: {
  textSize?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center font-serif font-semibold tracking-[-0.01em] text-foreground ${textSize} ${className}`}
    >
      Work<span className="text-accent">Able</span>
    </span>
  );
}
