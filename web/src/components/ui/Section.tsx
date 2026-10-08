export function Section({
  children,
  className = "",
  narrow = false,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <div className={`${narrow ? "max-w-3xl" : "max-w-6xl"} mx-auto px-4 sm:px-6 lg:px-8`}>
        {children}
      </div>
    </section>
  );
}
