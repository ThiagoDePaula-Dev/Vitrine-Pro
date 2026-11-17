import { siteConfig } from "@/config/site";

/** Logo simples (pin de mapa) + nome da marca. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold ${className}`}>
      <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="#0a0a0b" />
        <path d="M20 8c-5 0-9 4-9 9 0 6.5 9 15 9 15s9-8.5 9-15c0-5-4-9-9-9Z" fill="#f43f5e" />
        <circle cx="20" cy="17" r="3.5" fill="#fff" />
      </svg>
      {siteConfig.name}
    </span>
  );
}
