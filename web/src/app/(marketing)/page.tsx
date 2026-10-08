import Link from "next/link";
import { services } from "@/lib/site";
import { HomePostcodeForm } from "@/components/marketing/HomePostcodeForm";

export default function HomePage() {
  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-ink via-slate to-teal/10 text-white py-16 md:py-32 lg:py-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-[60%_40%] gap-8 lg:gap-12 items-start">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="eyebrow">Same-day courier &amp; logistics</p>
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
                  Real-time logistics
                  <br />
                  <span className="text-teal">infrastructure</span>
                </h1>
              </div>
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-xl font-light">
                From same-day courier to enterprise removals. Medical supplies, legal
                documents, warehouses. Your timeline. Real-time tracking. Every job verified.
              </p>
              <HomePostcodeForm />
              <div className="flex gap-8 pt-4 text-sm text-gray-400">
                {["No card required", "Instant quote", "Real-time tracked"].map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <span className="text-teal font-black">•</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:mt-0 mt-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal/20 to-transparent rounded-3xl blur-3xl" />
                <div className="relative bg-gradient-to-br from-gray-800/40 to-transparent border border-teal/30 rounded-3xl p-6 md:p-8 lg:p-10 backdrop-blur">
                  <div className="space-y-4 pb-6 border-b border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-gray-400 text-xs uppercase tracking-wide">Live Job</p>
                        <p className="text-white font-black text-lg">
                          #3847: Medical supplies → City Hospital
                        </p>
                      </div>
                      <div className="animate-pulse">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 py-6 border-b border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-300 font-medium">Driver en route</p>
                      <p className="text-teal font-black text-lg">12 min</p>
                    </div>
                    <div className="w-full bg-gray-700/30 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-teal to-teal-bright h-2 rounded-full"
                        style={{ width: "65%" }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Picked up</span>
                      <span>In transit</span>
                      <span>Delivery</span>
                    </div>
                  </div>
                  <div className="space-y-4 py-6">
                    <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">
                      Proof of Delivery
                    </p>
                    <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                      <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg aspect-video flex items-center justify-center border border-gray-600/30">
                        <div className="text-center space-y-2">
                          <div className="text-gray-500 text-sm">Photo captured</div>
                          <div className="text-gray-600 text-xs">On delivery completion</div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Time</span>
                          <span className="text-white font-medium">14:23 GMT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Location</span>
                          <span className="text-white font-medium">City Hospital, EC1A 1BB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-700/50 grid grid-cols-3 gap-4 text-xs">
                    {[
                      ["100%", "Tracked"],
                      ["Real-time", "Updates"],
                      ["Verified", "Proof"],
                    ].map(([a, b]) => (
                      <div key={b} className="text-center space-y-1">
                        <p className="text-teal font-black">{a}</p>
                        <p className="text-gray-400">{b}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 md:mb-24 space-y-4">
            <p className="eyebrow">Service Types</p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
              One platform.
              <br />
              Every service type.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl font-light leading-relaxed">
              From urgent couriers to enterprise removals. Same real-time tracking. Same
              deadline protection.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {services.map((s) => (
              <Link
                key={s.slug}
                href="/book"
                className="group relative bg-white p-8 lg:p-10 rounded-2xl border border-gray-200 hover:border-teal/50 hover:shadow-lg hover:shadow-teal/10 transition duration-300 flex flex-col overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-teal/10 text-teal font-black flex items-center justify-center mb-6">
                    {s.title.slice(0, 1)}
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-2 group-hover:text-teal transition">
                    {s.title}
                  </h3>
                  <p className="text-gray-600 text-sm font-light leading-relaxed">{s.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F5F5] py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <p className="eyebrow">Two-sided network</p>
            <h2 className="font-display text-3xl md:text-4xl font-black text-gray-900">
              Customers book. Drivers deliver. Admins run the board.
            </h2>
            <p className="text-gray-600 font-light leading-relaxed">
              Sign up as a customer for quotes and bookings, or as a driver to take jobs.
              Ops manage everything from the admin dashboard.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/auth/sign-up?role=customer" className="btn-primary">
                Customer signup
              </Link>
              <Link href="/auth/sign-up?role=driver" className="btn-secondary">
                Driver signup
              </Link>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              ["Customers", "Instant quotes, pay in full, live tracking"],
              ["Drivers", "Accept jobs, navigate, upload proof"],
              ["Admins", "Billing, settings, fleet, and bookings"],
            ].map(([t, d]) => (
              <div key={t} className="card-soft">
                <p className="font-black text-gray-900">{t}</p>
                <p className="text-sm text-gray-600 font-light mt-1">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
