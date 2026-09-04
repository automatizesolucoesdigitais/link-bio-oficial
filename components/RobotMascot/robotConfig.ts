/** Ajustes centrais do mascote. Alterar aqui evita caçar valores no componente. */
export const robotConfig = {
  enabled: true,

  /** Liga sobreposições de diagnóstico (caixa do robô, alvo, zonas seguras). */
  debug: false,

  /** Larguras do personagem; a altura renderizada é 1.27x estes valores. */
  sizeDesktop: 82, // ~104px de altura
  sizeTablet: 64, // ~81px
  sizeMobile: 46, // ~58px

  /** Abaixo desta largura o robô divide a tela com o conteúdo. */
  mobileBreakpoint: 560,
  /** A partir daqui existe calha lateral aproveitável fora da coluna. */
  gutterBreakpoint: 880,

  /** Distância desejada entre o robô e o elemento que ele destaca. */
  targetGapMin: 20,
  targetGapMax: 80,
  /** Respiro obrigatório em volta de qualquer conteúdo protegido. */
  contentSafePadding: 16,
  /** Distância mínima das bordas da viewport. */
  viewportInset: 14,

  /** Deslocamento entre posições. */
  moveMinMs: 400,
  moveMaxMs: 900,
  /** px por ms usados para escalar a duração conforme a distância. */
  moveSpeed: 1.15,

  /** Durações das poses. */
  introMs: 2100,
  lookMs: 900,
  pointHoldMs: 1500,
  farewellMs: 2800,
  reactionMs: 520,

  /** Uma zona só volta a provocar interação depois deste intervalo. */
  zoneCooldownMs: 18000,
  /** Intervalo mínimo entre duas coreografias quaisquer. */
  choreographyCooldownMs: 5200,
  /** Janela das microinterações no idle. */
  microMinMs: 4000,
  microMaxMs: 9000,

  /** Reação ao scroll. */
  scrollSettleMs: 200,
  /** Acima desta velocidade (px por frame) o scroll é considerado rápido. */
  fastScrollThreshold: 42,
} as const;

export type RobotConfig = typeof robotConfig;

/**
 * Pontos de parada. Cada zona do bio link tem um lado preferido, o que cria
 * o ziguezague pedido (direita, esquerda, direita...) em vez de uma coluna fixa.
 * `intensity` decide o quanto o robô se envolve: `strong` faz coreografia
 * completa, `soft` apenas olha.
 */
export type ZonePreference = {
  side: "right" | "left";
  intensity: "strong" | "soft";
  /** Variação de coreografia preferida; ver robotChoreography. */
  variant?: "look" | "tiltPoint" | "approachWave" | "bouncePoint" | "peek";
};

export const zonePreferences: Record<string, ZonePreference> = {
  perfil: { side: "right", intensity: "soft" },
  sobre: { side: "left", intensity: "strong", variant: "look" },
  "solucoes-intro": { side: "right", intensity: "soft" },
  "card-avaliacao": { side: "right", intensity: "strong", variant: "bouncePoint" },
  "card-sites": { side: "left", intensity: "strong", variant: "tiltPoint" },
  "card-automacao": { side: "right", intensity: "strong", variant: "approachWave" },
  "card-nfc": { side: "left", intensity: "strong", variant: "peek" },
  contato: { side: "right", intensity: "strong", variant: "look" },
};
