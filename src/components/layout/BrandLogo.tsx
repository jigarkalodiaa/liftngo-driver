import Image from "next/image";

type BrandLogoProps = {
  width?: number;
  height?: number;
  className?: string;
};

export default function BrandLogo({ width = 140, height = 48, className }: BrandLogoProps) {
  return (
    <Image
      src="/logo-liftngo.png"
      alt="LiftnGo Logistics"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
