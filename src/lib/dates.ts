/** ISO de "agora menos N dias" (isolado aqui para componentes de servidor ficarem puros). */
export const daysAgoISO = (days: number) => new Date(Date.now() - days * 864e5).toISOString();
