import Image from "next/image";
import Link from "next/link";

type Props = {
  href?: string;
  /** Visual size of the mark */
  size?: "sm" | "md" | "lg";
  /** Show wordmark text beside logo (for dark bars where JPG may need contrast) */
  showWordmark?: boolean;
  className?: string;
  priority?: boolean;
};

const sizes = {
  sm: { img: 28, text: "text-lg" },
  md: { img: 40, text: "text-xl" },
  lg: { img: 56, text: "text-2xl" },
};

export function BrandLogo({
  href = "/",
  size = "md",
  showWordmark = false,
  className = "",
  priority = false,
}: Props) {
  const s = sizes[size];
  const mark = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/brand/mobilare-logo.jpg"
        alt="Mobilare"
        width={s.img}
        height={s.img}
        className="rounded-md object-contain bg-white/95"
        priority={priority}
      />
      {showWordmark ? (
        <span className={`font-display font-black tracking-tight ${s.text}`}>
          Mobilare
        </span>
      ) : (
        <span className="sr-only">Mobilare</span>
      )}
    </span>
  );

  if (!href) return mark;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="Mobilare home">
      {mark}
    </Link>
  );
}
