import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { WheelOption } from "../backend.d";

const DEFAULT_COLORS = [
  "#F59E0B",
  "#EF4444",
  "#14B8A6",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F97316",
];

function getOptionColor(option: WheelOption, index: number): string {
  return option.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export interface SpinWheelHandle {
  spinTo: (targetLabel: string, durationMs: number) => Promise<void>;
}

interface Props {
  options: WheelOption[];
  size?: number;
}

const SpinWheel = forwardRef<SpinWheelHandle, Props>(
  ({ options, size = 300 }, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const currentRotation = useRef(0);
    const segmentsRef = useRef<
      {
        option: WheelOption;
        startAngle: number;
        endAngle: number;
        color: string;
      }[]
    >([]);

    const totalWeight = options.reduce((sum, o) => sum + Number(o.weight), 0);
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 8;

    // Build segments
    const segments: {
      option: WheelOption;
      startAngle: number;
      endAngle: number;
      color: string;
    }[] = [];
    let cumAngle = 0;
    for (let i = 0; i < options.length; i++) {
      const sweep = (Number(options[i].weight) / (totalWeight || 1)) * 360;
      segments.push({
        option: options[i],
        startAngle: cumAngle,
        endAngle: cumAngle + sweep,
        color: getOptionColor(options[i], i),
      });
      cumAngle += sweep;
    }
    segmentsRef.current = segments;

    function polarToCartesian(angle: number, radius: number) {
      const rad = ((angle - 90) * Math.PI) / 180;
      return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
    }

    function describeArc(startAngle: number, endAngle: number, radius: number) {
      const start = polarToCartesian(startAngle, radius);
      const end = polarToCartesian(endAngle, radius);
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      return [
        `M ${cx} ${cy}`,
        `L ${start.x} ${start.y}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
        "Z",
      ].join(" ");
    }

    function getLabelPosition(startAngle: number, endAngle: number) {
      const mid = (startAngle + endAngle) / 2;
      return polarToCartesian(mid, r * 0.65);
    }

    useImperativeHandle(ref, () => ({
      spinTo: (targetLabel: string, durationMs: number) => {
        return new Promise<void>((resolve) => {
          const segs = segmentsRef.current;
          const targetIndex = segs.findIndex(
            (s) => s.option.optionLabel === targetLabel,
          );
          if (targetIndex === -1) {
            resolve();
            return;
          }

          const seg = segs[targetIndex];
          const midAngle = (seg.startAngle + seg.endAngle) / 2;
          const targetRotOffset = -midAngle;
          const extraSpins = 5 + Math.floor(Math.random() * 3);
          const spinEnd =
            currentRotation.current +
            extraSpins * 360 +
            targetRotOffset -
            (currentRotation.current % 360);

          const group = svgRef.current?.querySelector(
            ".wheel-group",
          ) as SVGGElement | null;
          if (!group) {
            resolve();
            return;
          }

          group.style.transition = `transform ${durationMs}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
          group.style.transformOrigin = `${cx}px ${cy}px`;
          group.style.transform = `rotate(${spinEnd}deg)`;

          currentRotation.current = spinEnd;

          setTimeout(() => resolve(), durationMs + 100);
        });
      },
    }));

    // Reset on options change
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset only on options reference change
    useEffect(() => {
      const group = svgRef.current?.querySelector(
        ".wheel-group",
      ) as SVGGElement | null;
      if (group) {
        group.style.transition = "none";
        group.style.transform = "rotate(0deg)";
        currentRotation.current = 0;
      }
    }, [options]);

    if (options.length === 0) {
      return (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-label="Empty spin wheel"
          role="img"
        >
          <circle cx={cx} cy={cy} r={r} fill="#E6EAF0" />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#6B7280"
            fontSize="14"
          >
            Add options
          </text>
        </svg>
      );
    }

    return (
      <div className="relative inline-block">
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-label="Spin wheel"
          role="img"
        >
          <defs>
            <filter id="wheel-grayscale">
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
          {/* Shadow */}
          <circle cx={cx} cy={cy} r={r + 4} fill="rgba(15,31,52,0.08)" />
          {/* Border ring */}
          <circle cx={cx} cy={cy} r={r + 2} fill="white" />
          <g className="wheel-group">
            {segments.map((seg) => {
              const isDisabled = seg.option.enabled === false;
              return (
                <g
                  key={`${seg.option.id}-${seg.option.optionLabel}`}
                  filter={isDisabled ? "url(#wheel-grayscale)" : undefined}
                  opacity={isDisabled ? 0.45 : 1}
                >
                  <path
                    d={describeArc(seg.startAngle, seg.endAngle, r)}
                    fill={seg.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                  {seg.endAngle - seg.startAngle > 15 && (
                    <text
                      x={getLabelPosition(seg.startAngle, seg.endAngle).x}
                      y={getLabelPosition(seg.startAngle, seg.endAngle).y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={Math.min(13, r / (options.length * 0.6))}
                      fontWeight="600"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                      style={{
                        pointerEvents: "none",
                        textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                      }}
                    >
                      {seg.option.optionLabel.length > 10
                        ? `${seg.option.optionLabel.slice(0, 9)}…`
                        : seg.option.optionLabel}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
          {/* Center circle */}
          <circle
            cx={cx}
            cy={cy}
            r={16}
            fill="white"
            stroke="#E6EAF0"
            strokeWidth="2"
          />
          <circle cx={cx} cy={cy} r={8} fill="#2563EB" />
        </svg>
        {/* Pointer */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1"
          style={{ zIndex: 10 }}
        >
          <svg
            width="20"
            height="28"
            viewBox="0 0 20 28"
            aria-label="Wheel pointer"
            role="img"
          >
            <polygon points="10,28 0,0 20,0" fill="#0F1F34" />
            <polygon points="10,24 2,2 18,2" fill="white" opacity="0.3" />
          </svg>
        </div>
      </div>
    );
  },
);

SpinWheel.displayName = "SpinWheel";
export default SpinWheel;
