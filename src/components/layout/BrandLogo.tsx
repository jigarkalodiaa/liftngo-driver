import Image from "next/image";

type BrandLogoProps = {
  /** Logical width for `next/image` layout (asset scales with `className`). */
  width?: number;
  height?: number;
  className?: string;
  /** Smaller mark for dense headers (dashboard, app bar). */
  variant?: "default" | "compact";
};

export default function BrandLogo({
  width,
  height,
  className = "",
  variant = "default",
}: BrandLogoProps) {
  const w = width ?? (variant === "compact" ? 96 : 160);
  const h = height ?? (variant === "compact" ? 28 : 44);

  return (
    <Image
      src="/logo-liftngo.png"
      alt="LiftnGo Logistics"
      width={w}
      height={h}
      className={`object-contain object-left ${className}`.trim()}
      priority
      sizes={variant === "compact" ? "96px" : "160px"}
    />
  );
}
