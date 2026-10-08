import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";
import { blogPosts } from "@/lib/site";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Company"
        title="Blog"
        subtitle="Operational notes on same-day logistics, coverage, and proof of delivery."
        primaryHref="/contact"
        primaryLabel="Talk to us"
      />
      <Section>
        <div className="grid md:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="card-soft hover:border-teal/40 transition">
              <p className="text-xs text-gray-400 mb-3">{post.date}</p>
              <h2 className="font-black text-gray-900 mb-2">{post.title}</h2>
              <p className="text-sm text-gray-600 font-light">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
