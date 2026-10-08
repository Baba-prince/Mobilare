"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function HomePostcodeForm() {
  const [postcode, setPostcode] = useState("");
  const router = useRouter();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = postcode.trim();
    router.push(q ? `/book?postcode=${encodeURIComponent(q)}` : "/book");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 pt-4">
      <input
        type="text"
        placeholder="Enter your postcode"
        value={postcode}
        onChange={(e) => setPostcode(e.target.value)}
        className="flex-1 px-5 py-3 rounded-full bg-white text-charcoal placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal font-light"
      />
      <button type="submit" className="btn-primary shadow-xl shadow-teal/40">
        Book now
      </button>
    </form>
  );
}
