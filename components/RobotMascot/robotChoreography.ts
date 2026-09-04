import { robotConfig } from "./robotConfig";
import type { Point } from "./robotPositioning";

export type RobotState =
  | "intro"
  | "idle"
  | "moving"
  | "looking"
  | "pointing"
  | "happy"
  | "peeking"
  | "scrollReaction"
  | "formIdle"
  | "farewell";

/** Quanto maior, mais o estado se impõe. Evita coreografias concorrentes. */
export const PRIORITY: Record<RobotState, number> = {
  idle: 0,
  scrollReaction: 1,
  formIdle: 2,
  happy: 3,
  looking: 4,
  peeking: 4,
  moving: 5,
  pointing: 6,
  intro: 7,
  farewell: 8,
};

export type FaceMood =
  | "idle"
  | "happy"
  | "curious"
  | "lookLeft"
  | "lookRight"
  | "lookUp"
  | "lookDown"
  | "blink";

/** Micro-ações do repouso. Uma por vez, nunca simultâneas. */
export type MicroAction =
  | "blink"
  | "lookLeft"
  | "lookRight"
  | "headTilt"
  | "smallWave"
  | "happyBounce";

const MICRO_POOL: MicroAction[] = [
  "blink",
  "blink",
  "lookLeft",
  "lookRight",
  "headTilt",
  "smallWave",
  "happyBounce",
];

/** Passo de uma coreografia: estado + expressão + quanto tempo segura. */
export type Beat = {
  state: RobotState;
  mood?: FaceMood;
  ms: number;
  /** Levanta o braço apontando na direção calculada. */
  point?: boolean;
  /** Pequeno salto vertical. */
  bounce?: boolean;
  /** Acena. */
  wave?: boolean;
  /** Inclina a cabeça com curiosidade. */
  tilt?: boolean;
};

export type Variant = "look" | "tiltPoint" | "approachWave" | "bouncePoint" | "peek";

/**
 * Cada variação tem um ritmo próprio para que as seções não pareçam repetir
 * a mesma coreografia. Todas terminam voltando ao idle.
 */
export function buildSequence(variant: Variant, hasTarget: boolean): Beat[] {
  const look = robotConfig.lookMs;
  const hold = robotConfig.pointHoldMs;

  switch (variant) {
    case "look":
      return [
        { state: "looking", mood: "curious", ms: look },
        ...(hasTarget
          ? [{ state: "pointing" as const, mood: "happy" as const, ms: hold, point: true }]
          : []),
        { state: "happy", mood: "happy", ms: 420, bounce: true },
      ];

    case "tiltPoint":
      return [
        { state: "looking", mood: "curious", ms: look * 0.7, tilt: true },
        { state: "pointing", mood: "happy", ms: hold, point: true },
        { state: "happy", mood: "happy", ms: 380 },
      ];

    case "approachWave":
      return [
        { state: "looking", mood: "curious", ms: look * 0.6 },
        { state: "happy", mood: "happy", ms: 700, wave: true },
        { state: "pointing", mood: "happy", ms: hold * 0.85, point: true },
      ];

    case "bouncePoint":
      return [
        { state: "looking", mood: "happy", ms: look * 0.55 },
        { state: "happy", mood: "happy", ms: 420, bounce: true },
        { state: "pointing", mood: "happy", ms: hold, point: true },
        { state: "happy", mood: "happy", ms: 300, bounce: true },
      ];

    case "peek":
      return [
        { state: "peeking", mood: "curious", ms: 640, tilt: true },
        { state: "looking", mood: "curious", ms: look * 0.6 },
        { state: "pointing", mood: "happy", ms: hold * 0.9, point: true },
      ];
  }
}

export const introSequence = (): Beat[] => [
  { state: "intro", mood: "happy", ms: 620 },
  { state: "intro", mood: "curious", ms: 420 },
  { state: "intro", mood: "happy", ms: 700, wave: true },
  { state: "intro", mood: "happy", ms: 360, bounce: true },
];

export const farewellSequence = (): Beat[] => [
  { state: "farewell", mood: "happy", ms: 520 },
  { state: "farewell", mood: "happy", ms: 900, wave: true },
  { state: "farewell", mood: "happy", ms: 900, wave: true },
  { state: "farewell", mood: "happy", ms: 420, bounce: true },
];

/** Sorteio com semente simples: variedade sem depender de Math.random puro. */
export function pickMicro(seed: number): MicroAction {
  return MICRO_POOL[Math.abs(Math.floor(seed)) % MICRO_POOL.length];
}

export function microDelay(seed: number) {
  const span = robotConfig.microMaxMs - robotConfig.microMinMs;
  return robotConfig.microMinMs + (Math.abs(Math.floor(seed * 97)) % span);
}

export type Aim = {
  /** Braço que deve subir. */
  arm: "left" | "right";
  /** Rotação do braço, em graus, apontando para o alvo. */
  armAngle: number;
  /** Inclinação do corpo. */
  bodyTilt: number;
  /** Rotação da cabeça. */
  headTilt: number;
  /** Deslocamento dos olhos, em unidades do viewBox. */
  eyeX: number;
  eyeY: number;
  mood: FaceMood;
};

/**
 * Converte a posição relativa do alvo em ângulos concretos. É isto que faz o
 * gesto apontar de fato para o elemento, em vez de usar uma pose fixa.
 */
export function computeAim(robotCenter: Point, targetCenter: Point): Aim {
  const dx = targetCenter.x - robotCenter.x;
  const dy = targetCenter.y - robotCenter.y;
  const arm: "left" | "right" = dx < 0 ? "left" : "right";

  // Ângulo do vetor, com 0° apontando para baixo (posição de descanso do braço).
  const rad = Math.atan2(dy, Math.abs(dx));
  const deg = (rad * 180) / Math.PI; // +90 = direto para baixo, -90 = para cima
  // Braço em repouso já aponta ~60° para fora e para baixo; tiramos a diferença.
  const raw = 60 - deg;
  const armAngle = Math.max(-120, Math.min(35, arm === "left" ? -raw : raw));

  const norm = Math.max(-1, Math.min(1, dx / 240));
  const normY = Math.max(-1, Math.min(1, dy / 240));

  let mood: FaceMood = "curious";
  if (Math.abs(normY) > Math.abs(norm)) mood = normY < 0 ? "lookUp" : "lookDown";
  else mood = norm < 0 ? "lookLeft" : "lookRight";

  return {
    arm,
    armAngle,
    bodyTilt: norm * 5,
    headTilt: norm * 9,
    eyeX: norm * 2.4,
    eyeY: normY * 1.8,
    mood,
  };
}
