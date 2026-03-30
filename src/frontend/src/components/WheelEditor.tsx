import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import type { WheelOption } from "../backend.d";
import SpinWheel, { type SpinWheelHandle } from "./SpinWheel";

const PRESET_COLORS = [
  "#F59E0B",
  "#EF4444",
  "#14B8A6",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F97316",
];

interface EditorOption {
  id: string;
  label: string;
  percentage: number; // 0–100 float
  color: string;
  enabled: boolean;
}

interface Props {
  initialName?: string;
  initialOptions?: WheelOption[];
  isSaving?: boolean;
  onSave: (name: string, options: WheelOption[]) => void;
}

function toEditorOption(o: WheelOption, i: number): EditorOption {
  return {
    id: o.id,
    label: o.optionLabel,
    percentage: Number(o.weight) / 100,
    color: o.color ?? PRESET_COLORS[i % PRESET_COLORS.length],
    enabled: o.enabled,
  };
}

function toWheelOption(e: EditorOption): WheelOption {
  return {
    id: e.id,
    optionLabel: e.label,
    weight: BigInt(Math.round(e.percentage * 100)),
    color: e.color,
    enabled: e.enabled,
  };
}

function distributeEvenly(opts: EditorOption[]): EditorOption[] {
  const n = opts.length;
  if (n === 0) return opts;
  if (n === 1) return [{ ...opts[0], percentage: 100 }];
  const base = Number.parseFloat((100 / n).toFixed(1));
  const remainder = Number.parseFloat((100 - base * (n - 1)).toFixed(1));
  return opts.map((o, i) => ({
    ...o,
    percentage: i === n - 1 ? remainder : base,
  }));
}

function makePreviewOptions(opts: EditorOption[]): WheelOption[] {
  return opts.map((o) => ({
    id: o.id,
    optionLabel: o.label || "…",
    weight: BigInt(Math.round(o.percentage * 100)),
    color: o.color,
    enabled: o.enabled,
  }));
}

export default function WheelEditor({
  initialName = "",
  initialOptions = [],
  isSaving,
  onSave,
}: Props) {
  const [name, setName] = useState(initialName);
  const [options, setOptions] = useState<EditorOption[]>(() => {
    if (initialOptions.length > 0) {
      return initialOptions.map(toEditorOption);
    }
    return distributeEvenly([
      {
        id: crypto.randomUUID(),
        label: "Option 1",
        percentage: 50,
        color: PRESET_COLORS[0],
        enabled: true,
      },
      {
        id: crypto.randomUUID(),
        label: "Option 2",
        percentage: 50,
        color: PRESET_COLORS[1],
        enabled: true,
      },
    ]);
  });

  const previewRef = useRef<SpinWheelHandle>(null);

  // ── Percentage logic ────────────────────────────────────────────────────────

  const updatePercentage = (id: string, rawVal: number) => {
    setOptions((prev) => {
      if (prev.length <= 1) return prev;
      const idx = prev.findIndex((o) => o.id === id);
      if (idx === -1) return prev;

      // Filler is the last option; if editing last, filler is second-to-last
      const fillerIdx =
        idx === prev.length - 1 ? prev.length - 2 : prev.length - 1;

      // Sum of all options except the one being edited and the filler
      const othersSum = prev.reduce((sum, o, i) => {
        if (i === idx || i === fillerIdx) return sum;
        return sum + o.percentage;
      }, 0);

      const maxAllowed = Number.parseFloat((100 - othersSum).toFixed(1));
      const capped = Math.max(0, Math.min(rawVal, maxAllowed));
      const fillerPct = Number.parseFloat((maxAllowed - capped).toFixed(1));

      return prev.map((o, i) => {
        if (i === idx) return { ...o, percentage: capped };
        if (i === fillerIdx)
          return { ...o, percentage: Math.max(0, fillerPct) };
        return o;
      });
    });
  };

  // ── Add / Remove ────────────────────────────────────────────────────────────

  const addOption = () => {
    setOptions((prev) => {
      const newOpt: EditorOption = {
        id: crypto.randomUUID(),
        label: `Option ${prev.length + 1}`,
        percentage: 0,
        color: PRESET_COLORS[prev.length % PRESET_COLORS.length],
        enabled: true,
      };
      return distributeEvenly([...prev, newOpt]);
    });
  };

  const removeOption = (id: string) => {
    setOptions((prev) => {
      const remaining = prev.filter((o) => o.id !== id);
      if (remaining.length === 0) return prev;
      return distributeEvenly(remaining);
    });
  };

  const updateOption = (id: string, patch: Partial<EditorOption>) => {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    );
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = () => {
    const validOptions = options.filter((o) => o.label.trim());
    onSave(name.trim() || "Untitled Wheel", validOptions.map(toWheelOption));
  };

  const previewOptions = makePreviewOptions(
    options.filter((o) => o.label.trim()),
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Live wheel preview */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-1">
          <SpinWheel ref={previewRef} options={previewOptions} size={200} />
          <p className="text-xs text-muted-foreground">Live Preview</p>
        </div>
      </div>

      {/* Wheel Name */}
      <div>
        <Label
          htmlFor="wheel-name"
          className="text-sm font-semibold text-foreground mb-1.5 block"
        >
          Wheel Name
        </Label>
        <Input
          id="wheel-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Decision Wheel"
          data-ocid="editor.input"
          className="font-medium"
        />
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground">
            Options
          </Label>
          <span className="text-xs text-muted-foreground">% of wheel</span>
        </div>

        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
          {options.map((opt, idx) => (
            <div
              key={opt.id}
              data-ocid={`editor.item.${idx + 1}`}
              className={`flex flex-col gap-2 rounded-lg border border-border p-3 transition-opacity ${
                !opt.enabled ? "opacity-60" : ""
              }`}
            >
              {/* Row 1: color dot, label, toggle, delete */}
              <div className="flex items-center gap-2">
                {/* Color picker dot */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      data-ocid={`editor.toggle.${idx + 1}`}
                      className="w-7 h-7 rounded-full border-2 border-white shadow-sm flex-shrink-0 cursor-pointer transition-transform hover:scale-110 ring-1 ring-border"
                      style={{ backgroundColor: opt.color }}
                      title="Pick color"
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-52 p-3"
                    data-ocid="editor.popover"
                  >
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      Presets
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer"
                          style={{
                            backgroundColor: c,
                            borderColor:
                              opt.color === c ? "#0F1F34" : "transparent",
                            boxShadow:
                              opt.color === c
                                ? "0 0 0 2px white, 0 0 0 3px #0F1F34"
                                : undefined,
                          }}
                          onClick={() => updateOption(opt.id, { color: c })}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                      Custom Color
                    </p>
                    <label className="block cursor-pointer">
                      <div
                        className="w-full h-10 rounded-md border border-border overflow-hidden"
                        style={{ backgroundColor: opt.color }}
                      >
                        <input
                          type="color"
                          value={opt.color}
                          onChange={(e) =>
                            updateOption(opt.id, { color: e.target.value })
                          }
                          className="w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-1">
                        {opt.color.toUpperCase()}
                      </p>
                    </label>
                  </PopoverContent>
                </Popover>

                {/* Label */}
                <Input
                  value={opt.label}
                  onChange={(e) =>
                    updateOption(opt.id, { label: e.target.value })
                  }
                  placeholder={`Option ${idx + 1}`}
                  data-ocid={`editor.input.${idx + 1}`}
                  className="h-8 flex-1 min-w-0 text-sm"
                />

                {/* Enabled toggle */}
                <Switch
                  checked={opt.enabled}
                  onCheckedChange={(checked) =>
                    updateOption(opt.id, { enabled: checked })
                  }
                  data-ocid={`editor.switch.${idx + 1}`}
                  title={opt.enabled ? "Disable option" : "Enable option"}
                />

                {/* Remove */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                  onClick={() => removeOption(opt.id)}
                  data-ocid={`editor.delete_button.${idx + 1}`}
                  disabled={options.length <= 1}
                >
                  <X size={13} />
                </Button>
              </div>

              {/* Row 2: slider + number input */}
              <div className="flex items-center gap-2 pl-9">
                <Slider
                  min={0}
                  max={100}
                  step={0.1}
                  value={[opt.percentage]}
                  onValueChange={([v]) => updatePercentage(opt.id, v)}
                  disabled={options.length === 1}
                  data-ocid={`editor.toggle.weight.${idx + 1}`}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={opt.percentage}
                  onChange={(e) => {
                    const v = Number.parseFloat(e.target.value);
                    if (!Number.isNaN(v)) updatePercentage(opt.id, v);
                  }}
                  disabled={options.length === 1}
                  className="h-7 w-16 text-xs text-right font-mono flex-shrink-0"
                  data-ocid={`editor.input.pct.${idx + 1}`}
                />
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  %
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total indicator */}
        <div className="flex items-center justify-between text-xs mt-1 px-1">
          <span className="text-muted-foreground">Total</span>
          <span
            className={`font-mono font-semibold ${
              Math.abs(options.reduce((s, o) => s + o.percentage, 0) - 100) <
              0.5
                ? "text-green-600"
                : "text-destructive"
            }`}
          >
            {options.reduce((s, o) => s + o.percentage, 0).toFixed(1)}%
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={addOption}
          data-ocid="editor.secondary_button"
          className="mt-2 w-full border-dashed border-primary/50 text-primary hover:bg-primary/5"
        >
          <Plus size={14} className="mr-1" />
          Add Option
        </Button>
      </div>

      <Button
        onClick={handleSave}
        disabled={
          isSaving || options.filter((o) => o.label.trim()).length === 0
        }
        data-ocid="editor.submit_button"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
      >
        {isSaving ? (
          <>
            <Loader2 size={14} className="mr-2 animate-spin" />
            Saving…
          </>
        ) : (
          "Save Wheel"
        )}
      </Button>
    </div>
  );
}
