import Anthropic from "@anthropic-ai/sdk";

/** Cliente só de servidor. Falta de configuração vira erro claro, não 500 genérico. */
export function getAi() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL;
  if (!apiKey || !model) throw new Error("IA não configurada: defina ANTHROPIC_API_KEY e ANTHROPIC_MODEL.");
  return { client: new Anthropic({ apiKey }), model };
}
