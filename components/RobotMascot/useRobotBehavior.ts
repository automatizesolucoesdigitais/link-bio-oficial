"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { robotConfig, zonePreferences } from "./robotConfig";
import {
  buildSequence,
  computeAim,
  farewellSequence,
  introSequence,
  microDelay,
  pickMicro,
  PRIORITY,
  type Aim,
  type Beat,
  type FaceMood,
  type MicroAction,
  type RobotState,
  type Variant,
} from "./robotChoreography";
import {
  findPlacement,
  stillSafe,
  travelDuration,
  waypointFor,
  type Point,
} from "./robotPositioning";

export type RobotView = {
  state: RobotState;
  mood: FaceMood;
  micro: MicroAction | null;
  pos: Point | null;
  moveMs: number;
  /** Inclinação do corpo durante o deslocamento. */
  travelTilt: number;
  aim: Aim | null;
  pointing: boolean;
  bouncing: boolean;
  waving: boolean;
  tilting: boolean;
  scale: number;
  scrolling: boolean;
  hidden: boolean;
  reducedMotion: boolean;
  debugTarget: DOMRect | null;
};

const INITIAL: RobotView = {
  state: "intro",
  mood: "happy",
  micro: null,
  pos: null,
  moveMs: robotConfig.moveMinMs,
  travelTilt: 0,
  aim: null,
  pointing: false,
  bouncing: false,
  waving: false,
  tilting: false,
  scale: 1,
  scrolling: false,
  hidden: false,
  reducedMotion: false,
  debugTarget: null,
};

function currentSize() {
  const w = window.innerWidth;
  const base =
    w >= robotConfig.gutterBreakpoint
      ? robotConfig.sizeDesktop
      : w >= robotConfig.mobileBreakpoint
        ? robotConfig.sizeTablet
        : robotConfig.sizeMobile;
  return { w: base, h: Math.round(base * 1.27) };
}

/** Alvo de maior prioridade dentro de uma zona (1 = mais importante). */
function pickTarget(zone: Element): HTMLElement | null {
  const marked = Array.from(
    zone.querySelectorAll<HTMLElement>("[data-robot-target],[data-robot-cta]"),
  );
  if (!marked.length) return null;
  const visible = marked.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
  });
  const pool = visible.length ? visible : marked;
  pool.sort(
    (a, b) =>
      Number(a.dataset.robotPriority ?? 3) - Number(b.dataset.robotPriority ?? 3),
  );
  return pool[0] ?? null;
}

export function useRobotBehavior(rootRef: RefObject<HTMLDivElement | null>) {
  const [view, setView] = useState<RobotView>(INITIAL);

  // Estado vivo fora do React: o loop de scroll roda por frame.
  const posRef = useRef<Point | null>(null);
  const lockUntil = useRef(0);
  const lockState = useRef<RobotState>("intro");
  const zoneSeen = useRef(new Map<string, number>());
  const lastChoreo = useRef(0);
  const timers = useRef<number[]>([]);
  const seqId = useRef(0);
  const formFocused = useRef(false);

  useEffect(() => {
    if (!robotConfig.enabled) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pending = timers.current;
    const patch = (n: Partial<RobotView>) => setView((p) => ({ ...p, ...n }));
    const after = (fn: () => void, ms: number) => {
      pending.push(window.setTimeout(fn, ms));
    };
    const clearAll = () => {
      pending.forEach(window.clearTimeout);
      pending.length = 0;
    };

    // Modo debug (robotConfig.debug): registra decisoes em window.__robotTrace.
    const trace = (evento: string, dados: Record<string, unknown>) => {
      if (!robotConfig.debug) return;
      const w = window as unknown as { __robotTrace?: unknown[] };
      (w.__robotTrace ??= []).push({ t: Math.round(performance.now()), evento, ...dados });
    };

    patch({ reducedMotion: reduced });

    // ---------------- posicionamento ----------------

    const place = (target: DOMRect | null, zone: DOMRect | null, side: "right" | "left") => {
      const size = currentSize();
      const found = findPlacement({ size, previous: posRef.current, target, zone, side });
      trace("place", {
        side,
        temAlvo: !!target,
        achou: !!found,
        x: found ? Math.round(found.point.x) : null,
        y: found ? Math.round(found.point.y) : null,
      });
      if (!found) {
        patch({ hidden: true });
        return null;
      }
      const next = found.point;
      patch({ scale: found.scale });
      const from = posRef.current;
      const ms = from ? travelDuration(from, next) : 0;
      const tilt = from ? Math.max(-9, Math.min(9, (next.x - from.x) * 0.05)) : 0;

      // Trajeto: se cruzar a coluna, passa antes por uma margem livre.
      const via = from ? waypointFor(from, next, size) : null;
      if (via) {
        const legA = travelDuration(from!, via);
        posRef.current = via;
        patch({ pos: via, moveMs: legA, travelTilt: tilt, hidden: false, state: "moving" });
        after(() => {
          posRef.current = next;
          patch({ pos: next, moveMs: travelDuration(via, next), travelTilt: tilt });
        }, legA);
        return ms + legA;
      }

      posRef.current = next;
      patch({ pos: next, moveMs: ms, travelTilt: tilt, hidden: false });
      if (ms > 0) patch({ state: "moving" });
      after(() => patch({ travelTilt: 0 }), ms + 60);
      return ms;
    };

    // ---------------- execução de coreografias ----------------

    const runBeats = (beats: Beat[], aim: Aim | null, id: number) => {
      let t = 0;
      for (const beat of beats) {
        after(() => {
          if (id !== seqId.current) return;
          lockState.current = beat.state;
          patch({
            state: beat.state,
            mood: beat.mood ?? "idle",
            aim: beat.point ? aim : null,
            pointing: !!beat.point,
            bouncing: !!beat.bounce,
            waving: !!beat.wave,
            tilting: !!beat.tilt,
          });
        }, t);
        t += beat.ms;
      }
      after(() => {
        if (id !== seqId.current) return;
        lockUntil.current = 0;
        patch({
          state: formFocused.current ? "formIdle" : "idle",
          mood: "idle",
          aim: null,
          pointing: false,
          bouncing: false,
          waving: false,
          tilting: false,
        });
      }, t);
      return t;
    };

    const request = (next: RobotState, holdMs: number) => {
      const now = performance.now();
      if (now < lockUntil.current && PRIORITY[next] <= PRIORITY[lockState.current]) return false;
      lockUntil.current = now + holdMs;
      lockState.current = next;
      return true;
    };

    // ---------------- intro ----------------

    if (!reduced) {
      const id = ++seqId.current;
      lockUntil.current = performance.now() + robotConfig.introMs;
      lockState.current = "intro";
      const beats = introSequence();
      // Posição inicial: lateral do perfil.
      const perfil = document.querySelector("[data-robot-zone='perfil']");
      place(null, perfil?.getBoundingClientRect() ?? null, "right");
      runBeats(beats, null, id);
    } else {
      const perfil = document.querySelector("[data-robot-zone='perfil']");
      place(null, perfil?.getBoundingClientRect() ?? null, "right");
      patch({ state: "idle", mood: "idle" });
    }

    if (reduced) {
      // Sem observadores, sem scroll, sem microinterações.
      return clearAll;
    }

    // ---------------- zona dominante ----------------

    const zones = Array.from(document.querySelectorAll<HTMLElement>("[data-robot-zone]"));
    const ratios = new Map<Element, number>();
    let activeZone: HTMLElement | null = null;

    const engageZone = (zone: HTMLElement) => {
      const key = zone.dataset.robotZone ?? "";
      const pref = zonePreferences[key] ?? { side: "right" as const, intensity: "soft" as const };
      const now = performance.now();

      // Reposiciona sempre; a coreografia é que respeita cooldown.
      const target = pref.intensity === "strong" ? pickTarget(zone) : null;
      const targetRect = target?.getBoundingClientRect() ?? null;

      trace("zona", { zona: key, lado: pref.side, intensidade: pref.intensity });

      const canPerform =
        pref.intensity === "strong" &&
        !formFocused.current &&
        now - lastChoreo.current > robotConfig.choreographyCooldownMs &&
        now - (zoneSeen.current.get(key) ?? -Infinity) > robotConfig.zoneCooldownMs;

      const beats = canPerform
        ? buildSequence((pref.variant ?? "look") as Variant, !!targetRect)
        : null;
      const total = beats?.reduce((s, b) => s + b.ms, 0) ?? 0;

      if (!request(beats ? "looking" : "moving", total + 900)) return;

      const moveMs = place(canPerform ? targetRect : null, zone.getBoundingClientRect(), pref.side) ?? 0;
      if (view.hidden && !posRef.current) return;

      if (!beats) {
        after(() => {
          lockUntil.current = 0;
          patch({ state: formFocused.current ? "formIdle" : "idle" });
        }, moveMs + 120);
        return;
      }

      zoneSeen.current.set(key, now);
      lastChoreo.current = now;
      const id = ++seqId.current;
      patch({ debugTarget: targetRect });

      // Só mira depois de chegar: a direção depende da posição final.
      after(() => {
        if (id !== seqId.current) return;
        const size = currentSize();
        const here = posRef.current;
        const aim =
          here && targetRect
            ? computeAim(
                { x: here.x + size.w / 2, y: here.y + size.h / 2 },
                { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 },
              )
            : null;
        runBeats(beats, aim, id);
      }, moveMs + 80);
    };

    const zoneObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);
        let best: HTMLElement | null = null;
        let bestRatio = 0;
        for (const [el, r] of ratios) {
          if (r > bestRatio) {
            bestRatio = r;
            best = el as HTMLElement;
          }
        }
        if (best && best !== activeZone && bestRatio > 0.28) {
          activeZone = best;
          engageZone(best);
        }
      },
      { threshold: [0, 0.3, 0.5, 0.65, 0.85] },
    );
    zones.forEach((z) => zoneObserver.observe(z));

    // ---------------- despedida ----------------

    const endMarker = document.querySelector("[data-robot-end]");
    let waved = false;
    const endObserver = endMarker
      ? new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting && !waved) {
                waved = true;
                const beats = farewellSequence();
                const total = beats.reduce((s, b) => s + b.ms, 0);
                if (!request("farewell", total + 600)) return;
                const id = ++seqId.current;
                const moveMs = place(null, e.target.getBoundingClientRect(), "right") ?? 0;
                after(() => runBeats(beats, null, id), moveMs + 60);
              } else if (!e.isIntersecting) {
                waved = false;
              }
            }
          },
          { threshold: 0.4 },
        )
      : null;
    if (endMarker && endObserver) endObserver.observe(endMarker);

    // ---------------- scroll ----------------

    let lastY = window.scrollY;
    let queued = window.scrollY;
    let frame = 0;
    let settle = 0;

    const onFrame = () => {
      frame = 0;
      const delta = queued - lastY;
      lastY = queued;
      if (Math.abs(delta) < 1) return;

      // Scroll rápido: cancela coreografias de baixa prioridade e apenas segue.
      if (Math.abs(delta) > robotConfig.fastScrollThreshold) {
        if (PRIORITY[lockState.current] < PRIORITY.pointing) {
          seqId.current++;
          lockUntil.current = 0;
          patch({ pointing: false, waving: false, bouncing: false, aim: null });
        }
      }

      // Enquanto rola, o conteudo desliza por baixo do mascote. Ele fica
      // translucido ate o scroll assentar e a posicao ser reconferida.
      patch({ scrolling: true });
      if (performance.now() >= lockUntil.current) {
        patch({ state: "scrollReaction", travelTilt: Math.max(-6, Math.min(6, delta * 0.08)) });
      }

      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        // Reconferir a posição ANTES de voltar a ficar opaco: o conteúdo
        // deslizou por baixo do mascote enquanto a página rolava.
        const size = currentSize();
        if (posRef.current && !stillSafe(posRef.current, size)) {
          if (activeZone) {
            const pref = zonePreferences[activeZone.dataset.robotZone ?? ""];
            place(null, activeZone.getBoundingClientRect(), pref?.side ?? "right");
          } else {
            patch({ hidden: true });
          }
        }
        patch({ travelTilt: 0, scrolling: false });
        if (performance.now() >= lockUntil.current) {
          patch({ state: formFocused.current ? "formIdle" : "idle" });
        }
      }, robotConfig.scrollSettleMs);
    };

    const onScroll = () => {
      queued = window.scrollY;
      if (!frame) frame = window.requestAnimationFrame(onFrame);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ---------------- foco em formulário ----------------

    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.matches?.("input, textarea, select")) {
        formFocused.current = true;
        seqId.current++;
        lockUntil.current = 0;
        patch({
          state: "formIdle",
          mood: "idle",
          pointing: false,
          waving: false,
          bouncing: false,
          aim: null,
        });
      }
    };
    const onFocusOut = () => {
      formFocused.current = false;
      patch({ state: "idle" });
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    // ---------------- hover e clique nos CTAs ----------------

    const ctas = Array.from(document.querySelectorAll<HTMLElement>("[data-robot-cta]"));
    const react = (el: HTMLElement, mood: FaceMood) => {
      const now = performance.now();
      if (now - lastChoreo.current < robotConfig.choreographyCooldownMs) return;
      if (!request("happy", robotConfig.reactionMs)) return;
      lastChoreo.current = now;
      const id = ++seqId.current;
      const size = currentSize();
      const here = posRef.current;
      const r = el.getBoundingClientRect();
      const aim =
        here &&
        computeAim(
          { x: here.x + size.w / 2, y: here.y + size.h / 2 },
          { x: r.left + r.width / 2, y: r.top + r.height / 2 },
        );
      patch({ state: "happy", mood, bouncing: true, aim: aim || null });
      after(() => {
        if (id !== seqId.current) return;
        lockUntil.current = 0;
        patch({ state: "idle", mood: "idle", bouncing: false, aim: null });
      }, robotConfig.reactionMs);
    };

    const hoverHandlers: Array<[HTMLElement, () => void]> = [];
    if (window.matchMedia("(hover: hover)").matches) {
      for (const el of ctas) {
        const h = () => react(el, "happy");
        el.addEventListener("mouseenter", h);
        hoverHandlers.push([el, h]);
      }
    }
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.("[data-robot-cta]") as HTMLElement | null;
      if (el) react(el, "happy");
    };
    document.addEventListener("click", onClick, { passive: true });

    // ---------------- microinterações do idle ----------------

    let microTimer = 0;
    let tick = 0;
    const scheduleMicro = () => {
      tick += 1;
      microTimer = window.setTimeout(() => {
        const idle = performance.now() >= lockUntil.current;
        if (idle && !formFocused.current) {
          const action = pickMicro(tick * 7.3);
          patch({ micro: action });
          window.setTimeout(() => patch({ micro: null }), 900);
        }
        scheduleMicro();
      }, microDelay(tick));
    };
    scheduleMicro();

    // ---------------- reposicionamento em resize ----------------

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!activeZone) return;
        const pref = zonePreferences[activeZone.dataset.robotZone ?? ""];
        place(null, activeZone.getBoundingClientRect(), pref?.side ?? "right");
      }, 180);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("click", onClick);
      hoverHandlers.forEach(([el, h]) => el.removeEventListener("mouseenter", h));
      zoneObserver.disconnect();
      endObserver?.disconnect();
      window.clearTimeout(settle);
      window.clearTimeout(microTimer);
      window.clearTimeout(resizeTimer);
      if (frame) window.cancelAnimationFrame(frame);
      clearAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef]);

  return view;
}
