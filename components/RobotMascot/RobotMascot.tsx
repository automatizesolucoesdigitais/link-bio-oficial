"use client";

import { useRef, type CSSProperties } from "react";
import { robotConfig } from "./robotConfig";
import { useRobotBehavior } from "./useRobotBehavior";
import "./RobotMascot.css";

/**
 * Mascote da Automatize. A posição vem do positioning manager e é aplicada
 * como translate3d; os gestos animam grupos do SVG separadamente, para o
 * personagem parecer articulado em vez de uma figura deslizando.
 */
export function RobotMascot() {
  const rootRef = useRef<HTMLDivElement>(null);
  const v = useRobotBehavior(rootRef);

  if (!robotConfig.enabled) return null;

  const aim = v.aim;
  const armAngle = v.pointing && aim ? aim.armAngle : 0;
  const pointingArm = aim?.arm ?? "right";

  const style = {
    "--rb-x": `${v.pos?.x ?? 0}px`,
    "--rb-y": `${v.pos?.y ?? 0}px`,
    "--rb-move-ms": `${v.moveMs}ms`,
    "--rb-scale": `${v.scale}`,
    "--rb-travel-tilt": `${v.travelTilt}deg`,
    "--rb-body-tilt": `${v.pointing && aim ? aim.bodyTilt : 0}deg`,
    "--rb-head-tilt": `${v.pointing && aim ? aim.headTilt : 0}deg`,
    "--rb-eye-x": `${aim && (v.pointing || v.state === "looking") ? aim.eyeX : 0}px`,
    "--rb-eye-y": `${aim && (v.pointing || v.state === "looking") ? aim.eyeY : 0}px`,
    "--rb-arm-left": `${pointingArm === "left" ? armAngle : 0}deg`,
    "--rb-arm-right": `${pointingArm === "right" ? armAngle : 0}deg`,
  } as CSSProperties;

  return (
    <>
      <div
        ref={rootRef}
        className="rb-root"
        data-state={v.state}
        data-mood={v.mood}
        data-micro={v.micro ?? undefined}
        data-pointing={v.pointing || undefined}
        data-bouncing={v.bouncing || undefined}
        data-waving={v.waving || undefined}
        data-tilting={v.tilting || undefined}
        data-scrolling={v.scrolling || undefined}
        data-hidden={v.hidden || v.pos === null || undefined}
        data-reduced={v.reducedMotion || undefined}
        aria-hidden="true"
        style={style}
      >
        <div className="rb-float">
          <svg className="rb-svg" viewBox="0 0 120 152" role="presentation" focusable="false">
            <defs>
              <linearGradient id="rb-shell" x1="0.2" y1="0" x2="0.8" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#dfe6ef" />
              </linearGradient>
              <linearGradient id="rb-visor" x1="0.2" y1="0" x2="0.8" y2="1">
                <stop offset="0%" stopColor="#1d2a4d" />
                <stop offset="100%" stopColor="#111a33" />
              </linearGradient>
              <radialGradient id="rb-glow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.34" />
                <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
              </radialGradient>
              <clipPath id="rb-body-clip">
                <path d="M60 74c-19 0-31 17-31 34 0 19 14 31 31 31s31-12 31-31c0-17-12-34-31-34Z" />
              </clipPath>
            </defs>

            <ellipse className="rb-glow" cx="60" cy="86" rx="52" ry="56" fill="url(#rb-glow)" />

            <g className="rb-arm rb-arm-left">
              <path
                d="M34 88 L20 118"
                stroke="url(#rb-shell)"
                strokeWidth="6.6"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="19" cy="121" r="4.8" fill="url(#rb-shell)" />
            </g>
            <g className="rb-arm rb-arm-right">
              <path
                d="M86 88 L100 118"
                stroke="url(#rb-shell)"
                strokeWidth="6.6"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="101" cy="121" r="4.8" fill="url(#rb-shell)" />
            </g>

            <g className="rb-body">
              <g clipPath="url(#rb-body-clip)">
                <rect x="26" y="70" width="68" height="48" fill="url(#rb-shell)" />
                <rect x="26" y="118" width="68" height="26" fill="#23386e" />
                <rect x="26" y="116.3" width="68" height="1.9" fill="var(--cyan)" />
              </g>
              <path
                className="rb-chest"
                d="M55 103c0-4 3.2-6.4 5.6-4.6 2.6 2 1 6.8-2.4 6.8-2.4 0-3.2-2.6-1.2-4.4 1.8-1.6 4.6-1 6 1.4"
                stroke="var(--cyan)"
                strokeWidth="1.7"
                strokeLinecap="round"
                fill="none"
              />
            </g>

            <rect className="rb-neck" x="53" y="62" width="14" height="10" rx="5" fill="#23386e" />

            <g className="rb-head">
              <rect x="29" y="10" width="62" height="56" rx="27" fill="url(#rb-shell)" />
              <rect
                className="rb-visor-plate"
                x="36"
                y="21"
                width="48"
                height="33"
                rx="15.5"
                fill="url(#rb-visor)"
              />
              <g className="rb-face">
                <circle className="rb-eye rb-eye-left" cx="50" cy="37" r="3" fill="var(--cyan)" />
                <circle className="rb-eye rb-eye-right" cx="70" cy="37" r="3" fill="var(--cyan)" />
                <path
                  className="rb-mouth"
                  d="M54 44c2.4 3 9.6 3 12 0"
                  stroke="var(--cyan)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            </g>
          </svg>
        </div>
      </div>

      {robotConfig.debug && v.pos ? (
        <div
          className="rb-debug"
          aria-hidden="true"
          style={
            {
              "--rb-x": `${v.pos.x}px`,
              "--rb-y": `${v.pos.y}px`,
            } as CSSProperties
          }
        >
          <span>{v.state}</span>
          <span>{v.mood}</span>
          {v.micro ? <span>{v.micro}</span> : null}
        </div>
      ) : null}
    </>
  );
}
