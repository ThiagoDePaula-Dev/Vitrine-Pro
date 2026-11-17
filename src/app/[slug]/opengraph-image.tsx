import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { loadLanding } from "@/lib/landing/load";
import { seoText } from "@/lib/seo";

export const alt = "Página do profissional";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = { dark: "#0a0a0b", light: "#ffffff", vibrant: "#fff8f0" } as const;
const FG = { dark: "#f5f5f5", light: "#18181b", vibrant: "#1c1033" } as const;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadLanding(slug);
  const t = data?.theme.template ?? "dark";
  const { title, description } = data ? seoText(data) : { title: siteConfig.name, description: siteConfig.tagline };
  const place = data ? [data.profile.city, data.profile.state].filter(Boolean).join(" / ") : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: BG[t], color: FG[t] }}>
        <div style={{ display: "flex", width: 120, height: 12, borderRadius: 6, background: data?.theme.primary ?? "#e11d48" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{clip(title, 60)}</div>
          {description && <div style={{ fontSize: 34, opacity: 0.75, lineHeight: 1.3 }}>{clip(description, 130)}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, opacity: 0.7 }}>
          <span>{place}</span>
          <span>{siteConfig.name}</span>
        </div>
      </div>
    ),
    size,
  );
}
