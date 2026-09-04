import { robotConfig } from "./robotConfig";

export type Box = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };

/**
 * Elementos que o mascote jamais pode cobrir. Deliberadamente amplo: textos,
 * mídia e qualquer coisa clicável dentro da coluna do bio link.
 */
/** Nunca podem ser cobertos: carregam informacao ou recebem clique. */
const CRITICAL_SELECTOR = [
  "h1",
  "h2",
  "h3",
  "p",
  "li",
  "label",
  "input",
  "textarea",
  "button",
  "a",
].join(",");

/** Imagens sao evitadas, mas liberadas no ultimo degrau: nao carregam texto. */
const IMAGE_SELECTOR = "img";

const intersects = (a: Box, b: Box, pad = 0) =>
  a.x < b.x + b.w + pad &&
  a.x + a.w > b.x - pad &&
  a.y < b.y + b.h + pad &&
  a.y + a.h > b.y - pad;

const rectToBox = (r: DOMRect): Box => ({ x: r.left, y: r.top, w: r.width, h: r.height });

/** Caixas protegidas atualmente visíveis, em coordenadas de viewport. */
export function collectObstacles(includeImages = true): Box[] {
  const page = document.querySelector(".bio-page");
  if (!page) return [];
  const selector = includeImages
    ? CRITICAL_SELECTOR + "," + IMAGE_SELECTOR
    : CRITICAL_SELECTOR;
  const boxes: Box[] = [];
  for (const el of page.querySelectorAll(selector)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    // Só interessa o que divide a tela com o robô agora.
    if (r.bottom < -40 || r.top > window.innerHeight + 40) continue;
    boxes.push(rectToBox(r));
  }
  return boxes;
}

const insideViewport = (box: Box) => {
  const i = robotConfig.viewportInset;
  return (
    box.x >= i &&
    box.y >= i &&
    box.x + box.w <= window.innerWidth - i &&
    box.y + box.h <= window.innerHeight - i
  );
};

/** Telas estreitas nao comportam o respiro cheio. */
export const safePadding = () =>
  window.innerWidth < robotConfig.mobileBreakpoint ? 9 : robotConfig.contentSafePadding;

export const isFree = (box: Box, obstacles: Box[], pad = safePadding()) =>
  insideViewport(box) && !obstacles.some((o) => intersects(box, o, pad));

/**
 * Gera posições candidatas em volta de um alvo: laterais primeiro (é onde
 * costuma sobrar espaço numa coluna estreita), depois diagonais e topo/base.
 */
function candidatesAround(target: DOMRect, size: { w: number; h: number }): Point[] {
  const gaps = [robotConfig.targetGapMin, 40, 60, robotConfig.targetGapMax];
  const midY = target.top + target.height / 2 - size.h / 2;
  const out: Point[] = [];

  for (const gap of gaps) {
    const right = target.right + gap;
    const left = target.left - gap - size.w;
    out.push(
      { x: right, y: midY },
      { x: left, y: midY },
      { x: right, y: target.top - size.h * 0.35 },
      { x: left, y: target.top - size.h * 0.35 },
      { x: right, y: target.bottom - size.h * 0.65 },
      { x: left, y: target.bottom - size.h * 0.65 },
    );
  }

  // Acima e abaixo, alinhado às bordas do alvo (útil quando as laterais fecham).
  out.push(
    { x: target.right - size.w, y: target.top - size.h - robotConfig.targetGapMin },
    { x: target.left, y: target.top - size.h - robotConfig.targetGapMin },
    { x: target.right - size.w, y: target.bottom + robotConfig.targetGapMin },
    { x: target.left, y: target.bottom + robotConfig.targetGapMin },
  );
  return out;
}

/** Posições de repouso ao longo de uma zona, sem alvo específico. */
function candidatesForZone(
  zone: DOMRect,
  size: { w: number; h: number },
  side: "right" | "left",
): Point[] {
  const anchors = [0.32, 0.5, 0.68, 0.2, 0.8, 0.12, 0.9];
  const gaps = [24, 44, 68];
  const out: Point[] = [];
  // Um lado por chamada: quem decide a alternância é findPlacement, que tenta
  // o lado preferido da zona antes de considerar o oposto. Misturar os dois
  // aqui deixava o scoring escolher sempre o mais perto, prendendo o robô.
  const sides: Array<"right" | "left"> = [side];

  // Só a parte visível da zona serve de âncora: uma seção alta começa acima
  // e termina abaixo da viewport, e ancorar na altura total joga as
  // candidatas para fora da tela.
  const inset = robotConfig.viewportInset;
  let top = Math.max(zone.top, inset);
  let bottom = Math.min(zone.bottom, window.innerHeight - inset);

  // Fatia visível pequena demais (zona quase fora da tela): ancora na
  // viewport inteira, senão todas as candidatas nascem fora dos limites.
  if (bottom - top < size.h * 1.6) {
    top = inset;
    bottom = window.innerHeight - inset;
  }
  const height = Math.max(bottom - top - size.h, size.h);

  // Existe calha aproveitável deste lado? Se existe, o robô fica fora da
  // coluna. Candidatas internas só entram quando não há para onde ir —
  // caso contrário elas vencem o scoring por proximidade e o colocam
  // por cima do conteúdo.
  const gutter = (s: "right" | "left") =>
    s === "right" ? window.innerWidth - inset - zone.right : zone.left - inset;
  const needed = size.w + gaps[0];

  for (const s of sides) {
    const hasGutter = gutter(s) >= needed;
    for (const a of anchors) {
      const y = top + height * a;
      if (hasGutter) {
        for (const gap of gaps) {
          out.push({ x: s === "right" ? zone.right + gap : zone.left - gap - size.w, y });
        }
        out.push({ x: s === "right" ? window.innerWidth - size.w - inset : inset, y });
      } else {
        // Coluna ocupa a tela: encosta na borda interna dela.
        out.push({ x: s === "right" ? zone.right - size.w - 4 : zone.left + 4, y });
        out.push({ x: s === "right" ? window.innerWidth - size.w - inset : inset, y });
      }
    }
  }
  return out;
}

export type Scored = { point: Point; score: number };

/**
 * Pontuação: perto do alvo e do ponto atual é bom; encostar nas bordas e
 * atravessar a tela é ruim. Quem chama já filtrou as posições inseguras.
 */
function score(
  p: Point,
  size: { w: number; h: number },
  ref: Point | null,
  previous: Point | null,
  preferred?: { side: "right" | "left"; pivotX: number },
) {
  let s = 0;
  if (ref) {
    const d = Math.hypot(p.x + size.w / 2 - ref.x, p.y + size.h / 2 - ref.y);
    s -= d * 1.0;
  }
  if (previous) {
    const move = Math.hypot(p.x - previous.x, p.y - previous.y);
    s -= move * 0.2; // movimentos curtos parecem mais naturais
    if (move < 4) s -= 60; // mas ficar exatamente parado é pior
  }
  // Lado pedido pela zona. Sem este bônus a penalidade de movimento sempre
  // vence e o mascote nunca troca de lado — o problema que motivou a revisão.
  if (preferred) {
    const center = p.x + size.w / 2;
    const onPreferred =
      preferred.side === "right" ? center > preferred.pivotX : center < preferred.pivotX;
    if (onPreferred) s += 220;
  }
  // Prefere sobrar espaço até a borda.
  const edge = Math.min(
    p.x,
    p.y,
    window.innerWidth - (p.x + size.w),
    window.innerHeight - (p.y + size.h),
  );
  s += Math.min(edge, 90) * 0.55;
  return s;
}

export type PlacementRequest = {
  size: { w: number; h: number };
  previous: Point | null;
  /** Elemento que o robô quer destacar, se houver. */
  target?: DOMRect | null;
  /** Zona atual, usada quando não há alvo. */
  zone?: DOMRect | null;
  side: "right" | "left";
};

/**
 * Escolhe a melhor posição livre. Devolve null quando nada é seguro — nesse
 * caso quem chama deve esconder o mascote em vez de cobrir conteúdo.
 */
export type Placement = { point: Point; scale: number };

/**
 * Escada de fallback: tenta tamanho cheio, depois reduzido, e só então libera
 * sobreposição de imagens decorativas. Texto, campos e botões nunca entram na
 * negociação — se nada servir, devolve null e o mascote se esconde.
 */
export function findPlacement(req: PlacementRequest): Placement | null {
  const { size, previous, target, zone, side } = req;

  const ref = target
    ? { x: target.left + target.width / 2, y: target.top + target.height / 2 }
    : zone
      ? { x: side === "right" ? zone.right : zone.left, y: zone.top + zone.height / 2 }
      : null;

  const tiers: Array<{ scale: number; withImages: boolean }> = [
    { scale: 1, withImages: true },
    { scale: 0.78, withImages: true },
    { scale: 1, withImages: false },
    { scale: 0.78, withImages: false },
  ];

  const other: "right" | "left" = side === "right" ? "left" : "right";

  for (const tier of tiers) {
    const s = { w: size.w * tier.scale, h: size.h * tier.scale };
    const obstacles = collectObstacles(tier.withImages);

    // Lado preferido primeiro; o oposto só entra se o preferido não couber.
    for (const trySide of [side, other]) {
      const raw = target
        ? candidatesAround(target, s)
        : zone
          ? candidatesForZone(zone, s, trySide)
          : [];

      // Com alvo, o pivô é o centro dele; sem alvo, o centro da zona.
      const pivotX = target
        ? target.left + target.width / 2
        : zone
          ? zone.left + zone.width / 2
          : window.innerWidth / 2;

      let best: Scored | null = null;
      for (const p of raw) {
        if (!isFree({ x: p.x, y: p.y, w: s.w, h: s.h }, obstacles)) continue;
        const sc = score(p, s, ref, previous, { side: trySide, pivotX });
        if (!best || sc > best.score) best = { point: p, score: sc };
      }
      if (best) return { point: best.point, scale: tier.scale };
      // Com alvo definido as candidatas já cobrem os dois lados.
      if (target) break;
    }
  }
  return null;
}

/** A posição atual continua livre? Usado após reflow e scroll. */
export function stillSafe(point: Point, size: { w: number; h: number }) {
  return isFree({ x: point.x, y: point.y, w: size.w, h: size.h }, collectObstacles());
}

/**
 * Trajeto: quando o robô troca de lado, atravessar o meio passaria por cima
 * dos textos. Devolve um waypoint pela margem mais livre, ou null se o
 * caminho direto já é aceitável.
 */
export function waypointFor(from: Point, to: Point, size: { w: number; h: number }): Point | null {
  const crossesColumn = Math.sign(to.x - from.x) !== 0 && Math.abs(to.x - from.x) > size.w * 2.2;
  if (!crossesColumn) return null;

  const obstacles = collectObstacles();
  const topLane = Math.max(robotConfig.viewportInset, Math.min(from.y, to.y) - size.h * 0.9);
  const bottomLane = Math.min(
    window.innerHeight - size.h - robotConfig.viewportInset,
    Math.max(from.y, to.y) + size.h * 0.9,
  );

  for (const y of [topLane, bottomLane]) {
    const mid = { x: (from.x + to.x) / 2, y };
    if (isFree({ x: mid.x, y: mid.y, w: size.w, h: size.h }, obstacles)) return mid;
  }
  return null;
}

/** Duração proporcional à distância, dentro dos limites configurados. */
export function travelDuration(from: Point, to: Point) {
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  return Math.round(
    Math.max(robotConfig.moveMinMs, Math.min(robotConfig.moveMaxMs, d * robotConfig.moveSpeed)),
  );
}
