import { Router } from "express";

const router = Router();

router.post("/suggest", (req, res) => {
  const { place, budget, days, blindMode } = req.body;

  if (!place || !budget || !days) {
    return res.status(400).json({ message: "Preencha lugar, orçamento e dias." });
  }

  if (blindMode) {
    setTimeout(() => {
      res.json({
        title: `Roteiro Secreto de ${days} Dias`,
        overview: `A IA planejou uma aventura misteriosa para você com orçamento ${budget}. O destino é mantido em segredo! Prepare-se para ser surpreendido.`,
        itinerary: [
          `Dia 1: Chegada ao nosso destino secreto. Faça o check-in na acomodação e explore os restaurantes misteriosos próximos.`,
          `Dia 2: Dia focado em vivenciar a atração principal desta região surpresa. Dica: Leve câmera!`,
          `Dia 3: Despedida épica do local misterioso saboreando a cultura local.`
        ],
        tags: ["Cego", "Mistério", "Surpresa"]
      });
    }, 1500);
    return;
  }

  // Simulating an AI generated response
  const suggestions = [
    `Dia 1: Chegada em ${place} e exploração do centro histórico. Jantar em um restaurante conceituado.`,
    `Dia 2: Visita aos principais pontos turísticos focando em experiências de ${budget.toLowerCase()} custo.`,
    `Dia 3: Passeio relaxante e compras locais, aproveitando as últimas horas em ${place}.`
  ];

  if (days > 3) {
    suggestions.push(`Dias extras: Imersão cultural nas áreas menos conhecidas de ${place}!`);
  }

  setTimeout(() => {
    res.json({
      title: `Roteiro Inteligente para ${place}`,
      overview: `Com base em um orçamento ${budget} para ${days} dias, aqui está a sugestão ideal para você aproveitar o máximo de ${place}.`,
      itinerary: suggestions,
      tags: ["AI", "Otimizado", "Culture"]
    });
  }, 1500); // 1.5s delay to mock API reasoning time
});

export default router;
