import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Wheel } from "../backend.d";

const SEGMENT_COLORS = [
  "#F59E0B",
  "#EF4444",
  "#14B8A6",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F97316",
];

function MiniWheel({ options }: { options: Wheel["options"] }) {
  const size = 48;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;
  const total = options.reduce((s, o) => s + Number(o.weight), 0) || 1;

  function polar(angle: number, rad: number) {
    const a = ((angle - 90) * Math.PI) / 180;
    return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) };
  }

  let cum = 0;
  const segs = options.map((o, i) => {
    const sweep = (Number(o.weight) / total) * 360;
    const start = cum;
    cum += sweep;
    const color = o.color ?? SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    const disabled = o.enabled === false;
    return { id: o.id, label: o.optionLabel, start, end: cum, color, disabled };
  });

  function arc(s: number, e: number) {
    const p1 = polar(s, r);
    const p2 = polar(e, r);
    const large = e - s > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
  }

  if (options.length === 0)
    return (
      <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center text-muted-foreground text-xs">
        ?
      </div>
    );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label="Mini wheel preview"
      role="img"
    >
      <defs>
        <filter id="mini-grayscale">
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      {segs.map((s) => (
        <path
          key={`${s.id}-${s.label}`}
          d={arc(s.start, s.end)}
          fill={s.color}
          stroke="white"
          strokeWidth="1"
          filter={s.disabled ? "url(#mini-grayscale)" : undefined}
          opacity={s.disabled ? 0.45 : 1}
        />
      ))}
      <circle cx={cx} cy={cy} r={6} fill="white" />
    </svg>
  );
}

interface Props {
  wheel: Wheel;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  index: number;
}

export default function WheelCard({
  wheel,
  isSelected,
  onSelect,
  onDelete,
  index,
}: Props) {
  return (
    <div
      data-ocid={`wheels.item.${index}`}
      className={`relative rounded-xl border-2 transition-all ${
        isSelected
          ? "border-primary bg-primary/5 shadow-card"
          : "border-border bg-card shadow-xs hover:border-primary/40 hover:shadow-card"
      }`}
    >
      {/* Clickable main area */}
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left p-4 pr-20"
        aria-label={`Select ${wheel.name}`}
      >
        <div className="flex items-center gap-3">
          <MiniWheel options={wheel.options} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">
              {wheel.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {wheel.options.length} options
            </p>
          </div>
        </div>
      </button>

      {/* Action buttons */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onSelect}
          data-ocid={`wheels.edit_button.${index}`}
        >
          <Pencil size={13} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          data-ocid={`wheels.delete_button.${index}`}
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}
