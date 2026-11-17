import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import { Tracker } from "@/components/landing/Tracker";
import { siteConfig } from "@/config/site";
import { loadLanding } from "@/lib/landing/load";
import { loadReviews } from "@/lib/reviews";
import { buildJsonLd, jsonLdScript, seoText } from "@/lib/seo";

type Props = PageProps<"/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadLanding(slug);
  if (!data) return {};
  const { title, description } = seoText(data);
  const url = `${siteConfig.url}/${slug}`;
  return {
    title,
    description: description || undefined,
    alternates: { canonical: url },
    robots: slug === "exemplo" ? { index: false } : undefined,
    // a imagem OG vem de ./opengraph-image.tsx (convenção do Next)
    openGraph: { title, description: description || undefined, url, type: "website" },
    twitter: { card: "summary_large_image", title, description: description || undefined },
  };
}

async function Landing({ params, searchParams }: Props) {
  const { slug } = await params;
  const { template } = await searchParams;
  const data = await loadLanding(slug, typeof template === "string" ? template : undefined);
  if (!data) notFound();
  const reviews = slug === "exemplo" ? null : await loadReviews(slug);
  const ld = buildJsonLd(data, `${siteConfig.url}/${slug}`, reviews);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />
      <LandingRenderer data={data} reviews={reviews} />
      {reviews && <Tracker professionalId={reviews.professionalId} />}
    </>
  );
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Landing {...props} />
    </Suspense>
  );
}
