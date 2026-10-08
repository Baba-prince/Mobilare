import Link from "next/link";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function PageHero({
  eyebrow,
  title,
  subtitle,
  primaryHref = "/book",
  primaryLabel = "Book now",
  secondaryHref,
  secondaryLabel,
}: Props) {
  return (
    <section className="bg-gradient-to-br from-ink via-slate to-teal/10 text-white py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {eyebrow ? <p className="eyebrow text-teal-bright">{eyebrow}</p> : null}
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black leading-tight max-w-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-lg md:text-xl text-gray-300 font-light leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href={primaryHref} className="btn-primary">
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref} className="btn-secondary border-white/30 text-white hover:bg-white/5">
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
