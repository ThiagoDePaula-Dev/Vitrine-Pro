import type { LandingData } from "./schema";

// DADOS FICTÍCIOS apenas para demonstração (/exemplo). Contato, registro e preços não são reais.
// Depoimentos e fotos ficam vazios de propósito: nada de prova social inventada.
export const sampleLanding: LandingData = {
  isHealth: true,
  whatsappMessage: "",
  seo: {
    title: "Personal trainer — consultoria de treino",
    description: "Treino individualizado, presencial ou online.",
  },
  profile: {
    name: "Profissional Exemplo",
    registry: "CREF 000000-G/UF",
    city: "São Paulo",
    state: "SP",
    online: true,
    whatsapp: "5500000000000",
    instagram: "exemplo",
    email: "",
    cnpj: "",
  },
  theme: { template: "dark", primary: "#e11d48", accent: "#f59e0b", fontPair: "bold", radius: "lg" },
  sections: [
    {
      id: "hero", type: "hero", enabled: true,
      eyebrow: "Personal trainer",
      title: "Treino pensado para a sua rotina",
      subtitle: "Acompanhamento individual, presencial ou online, com foco em constância e técnica.",
      image: { url: "", alt: "" },
      ctaLabel: "Falar no WhatsApp",
    },
    {
      id: "plans", type: "plans", enabled: true,
      title: "Planos",
      subtitle: "Escolha o formato que cabe na sua rotina.",
      items: [
        { name: "Mensal", priceCents: 30000, periodMonths: 1, features: ["Treino individualizado", "Ajustes mensais", "Suporte pelo WhatsApp"], checkoutUrl: "", highlighted: false },
        { name: "Trimestral", priceCents: 79000, periodMonths: 3, features: ["Tudo do mensal", "Reavaliação a cada mês", "Material de apoio"], checkoutUrl: "", highlighted: true },
        { name: "Semestral", priceCents: 150000, periodMonths: 6, features: ["Tudo do trimestral", "Planejamento de longo prazo"], checkoutUrl: "", highlighted: false },
      ],
    },
    {
      id: "about", type: "about", enabled: true,
      title: "Sobre mim",
      text: "Texto de apresentação do profissional (formação, abordagem de trabalho, tempo de experiência).",
      images: [],
    },
    {
      id: "results", type: "results", enabled: false,
      title: "Resultados", images: [], showBeforeAfter: false,
    },
    {
      id: "how", type: "how", enabled: true,
      title: "Como funciona",
      steps: [
        { title: "Conversa inicial", text: "Você conta seu objetivo, rotina e histórico." },
        { title: "Plano de treino", text: "Montamos o treino de acordo com sua disponibilidade." },
        { title: "Acompanhamento", text: "Ajustes ao longo do período, com suporte direto." },
      ],
    },
    { id: "testimonials", type: "testimonials", enabled: false, title: "Depoimentos", images: [] },
    {
      id: "faq", type: "faq", enabled: true,
      title: "Perguntas frequentes",
      items: [
        { q: "Preciso de academia?", a: "Depende do objetivo; o treino pode ser adaptado ao seu local." },
        { q: "Como funciona o atendimento online?", a: "Treino enviado e acompanhado à distância, com suporte por mensagem." },
      ],
    },
    {
      id: "cta", type: "cta", enabled: true,
      title: "Vamos conversar?",
      text: "Chame no WhatsApp e tire suas dúvidas sem compromisso.",
      ctaLabel: "Chamar no WhatsApp",
    },
    { id: "footer", type: "footer", enabled: true, text: "", showCnpj: false },
  ],
};
