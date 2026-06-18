import { useId } from "react";

const LEVELS = 14;
const PERIOD = 4;
const AMPLITUDE = 6;

type HelixMarkProps = {
  className?: string;
  animated?: boolean;
  /** Color of the second strand (the first is always sage green). */
  strandColor?: string;
};

/**
 * Double-helix mark. Animated: each level is a pair of bars whose
 * phase-offset translateX animations spin the strands. Static: the same
 * geometry frozen mid-spin, computed per level. Soft glow on the green
 * strand either way.
 */
export function HelixMark({
  className = "h-6 w-4.5",
  animated = true,
  strandColor = "#F5F5F7",
}: HelixMarkProps) {
  const glowId = useId();
  return (
    <svg viewBox="0 0 24 32" fill="none" aria-hidden className={className}>
      <defs>
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {Array.from({ length: LEVELS }, (_, i) => {
        const y = 2 + (i * 28) / (LEVELS - 1);
        const theta = (i / LEVELS) * Math.PI * 2;
        const bar = (offset: number, opacity: number, fill: string, glow: boolean) => (
          <rect
            x={9 + offset}
            y={y - 0.5}
            width={6}
            height={1}
            rx={0.5}
            fill={fill}
            opacity={opacity}
            filter={glow ? `url(#${glowId})` : undefined}
          />
        );
        if (!animated) {
          return (
            <g key={i}>
              {bar(Math.sin(theta) * AMPLITUDE, 0.575 + 0.425 * Math.cos(theta), "#39FF14", true)}
              {bar(
                -Math.sin(theta) * AMPLITUDE,
                0.575 - 0.425 * Math.cos(theta),
                strandColor,
                false,
              )}
            </g>
          );
        }
        const delay = `${-(i / LEVELS) * PERIOD}s`;
        return (
          <g key={i}>
            <rect
              x={9}
              y={y - 0.5}
              width={6}
              height={1}
              rx={0.5}
              fill="#39FF14"
              filter={`url(#${glowId})`}
              className="animate-helix-strand-a"
              style={{ animationDelay: delay }}
            />
            <rect
              x={9}
              y={y - 0.5}
              width={6}
              height={1}
              rx={0.5}
              fill={strandColor}
              className="animate-helix-strand-b"
              style={{ animationDelay: delay }}
            />
          </g>
        );
      })}
    </svg>
  );
}
