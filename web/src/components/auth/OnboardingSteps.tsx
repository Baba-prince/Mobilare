"use client";

import Link from "next/link";
import { useState } from "react";

type Step = { title: string; body: string };

export function OnboardingSteps({
  role,
  steps,
  finishHref,
}: {
  role: "customer" | "driver";
  steps: Step[];
  finishHref: string;
}) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const last = index === steps.length - 1;

  return (
    <div className="max-w-xl mx-auto card-soft space-y-6">
      <div>
        <p className="eyebrow mb-2">{role === "driver" ? "Driver wizard" : "Customer wizard"}</p>
        <h1 className="font-display text-3xl font-black text-gray-900">{step.title}</h1>
        <p className="text-gray-600 font-light mt-3 leading-relaxed">{step.body}</p>
      </div>
      <div className="flex gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= index ? "bg-teal" : "bg-gray-200"}`}
          />
        ))}
      </div>
      <div className="flex gap-3">
        {index > 0 ? (
          <button type="button" className="btn-secondary" onClick={() => setIndex((i) => i - 1)}>
            Back
          </button>
        ) : null}
        {!last ? (
          <button type="button" className="btn-primary" onClick={() => setIndex((i) => i + 1)}>
            Continue
          </button>
        ) : (
          <Link href={finishHref} className="btn-primary">
            Enter portal
          </Link>
        )}
      </div>
    </div>
  );
}
