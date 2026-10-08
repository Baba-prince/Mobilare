import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";
import { blogPosts } from "@/lib/site";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = blogPosts.find((p) => p.slug === params.slug);
  return { title: post?.title ?? "Blog" };
}

export default function BlogPostPage({ params }: Props) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  return (
    <>
      <PageHero eyebrow={post.date} title={post.title} subtitle={post.excerpt} />
      <Section narrow>
        <article className="space-y-4 text-gray-600 font-light leading-relaxed text-lg">
          <p>
            Mobilare teams use this playbook on live jobs every day — from quote to verified
            handoff. This article expands on {post.title.toLowerCase()} for operators and shippers.
          </p>
          <p>
            If you need a same-day lane for your organisation, book a run or contact support for
            volume pricing.
          </p>
        </article>
      </Section>
    </>
  );
}
