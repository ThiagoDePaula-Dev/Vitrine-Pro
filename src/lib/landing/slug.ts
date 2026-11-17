export const RESERVED_SLUGS = ["admin", "api", "busca", "login", "categorias"] as const;
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const isReserved = (slug: string) => (RESERVED_SLUGS as readonly string[]).includes(slug);

/** Mesmas regras do CHECK do banco. Devolve a mensagem de erro, ou null se o slug é válido. */
export function validateSlug(raw: string): string | null {
  const slug = raw.trim().toLowerCase();
  if (!slug) return "Informe o endereço";
  if (slug.length > 60) return "Endereço muito longo (máx. 60)";
  if (!SLUG_RE.test(slug)) return "Endereço inválido (use letras minúsculas, números e hífen)";
  if (isReserved(slug)) return "Esse endereço é reservado";
  return null;
}
