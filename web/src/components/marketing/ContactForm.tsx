"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="card-soft bg-teal/5 border-teal/30">
        <p className="font-black text-gray-900">Message received</p>
        <p className="text-sm text-gray-600 font-light mt-2">
          Thanks — we will reply to the email you provided.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card-soft space-y-4">
      <input name="name" required placeholder="Name" className="input-field" />
      <input name="email" type="email" required placeholder="Email" className="input-field" />
      <textarea name="message" required rows={4} placeholder="How can we help?" className="input-field" />
      <button type="submit" className="btn-primary w-full">
        Send message
      </button>
    </form>
  );
}
