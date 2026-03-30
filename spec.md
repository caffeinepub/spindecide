# SpinDecide — Color, Percentage Weights & Live Preview Update

## Current State
- WheelOption has `weight: Nat` (arbitrary 1–100 int) and `color: ?Text`
- WheelEditor uses a slider (1–100) for weight with no percentage semantics
- SpinWheel renders a static SVG that updates only when parent re-renders
- No per-option toggle (enabled/disabled)
- Color picker shows only 8 preset swatches, no full color picker
- No live wheel preview in the editor panel

## Requested Changes (Diff)

### Add
- `enabled: Bool` field to `WheelOption` backend type (toggled-off options excluded from spin)
- Full color picker (native `<input type="color">` inside the popover, plus presets) per option
- Per-option enable/disable toggle (doesn't change percentages; greyscale on wheel when off)
- Live wheel preview embedded directly in WheelEditor so changes reflect instantly
- Percentage-based weight system: weights stored as floats (0–100) summing to 100%
  - Single option auto-locks to 100%
  - When user adjusts one option's %, others auto-redistribute proportionally among remaining
  - Last-added option auto-fills remainder
  - Hard cap: cannot enter value that would push total over 100
  - Both slider and numeric text input per option

### Modify
- `WheelOption.weight` semantics: treat as percentage (0–100 float stored as Nat * 100 to keep Nat type, i.e. `weight` = percent * 100 integer)
  - Alternative: store as `Float` — use Float for cleaner percentage semantics
  - Decision: keep `weight: Nat` but interpret as basis points (100 = 1%, 10000 = 100%), OR switch to storing percentage directly as Nat (0–100) and accept rounding. Use Nat 0–10000 (basis points) for precision.
- SpinWheel: accept live `options` prop updates and re-render segments immediately (already does this; ensure greyscale filter for disabled options)
- WheelEditor layout: add live wheel preview panel alongside option rows
- App.tsx: the separate SpinWheel shown in left panel stays for spinning; WheelEditor now has its own live-preview wheel (read-only, no spin)
- Existing wheels: clear on deploy (schema change; user approved)

### Remove
- Old weight-only slider (replace with dual slider + text input)
- 8-preset-only color picker (replace with presets + full color input)

## Implementation Plan
1. Update `WheelOption` in `main.mo`: add `enabled: Bool` field; keep `weight: Nat` as basis points (0–10000 where 10000 = 100.00%)
2. Update `backend.d.ts` to match new types
3. Rewrite `WheelEditor.tsx`:
   - Internal state: `percentage: number` (0–100, float) per option; `enabled: boolean`
   - On any % change: redistribute remaining % proportionally among other options; last option fills remainder
   - Both `<Slider>` (0–100) and `<Input type="number">` for percentage
   - Color dot opens Popover with 8 presets + `<input type="color">` for full picker
   - Toggle switch per option (shadcn Switch)
   - Inline live SpinWheel preview (read-only, no ref needed) that re-renders on every state change
   - Convert to backend: percentage * 100 = weight (basis points)
4. Update `SpinWheel.tsx`:
   - Accept `enabled` on WheelOption
   - Disabled options: render with greyscale CSS filter on their slice
   - `spinWheel` backend: filter out disabled options before random pick
5. Update `App.tsx`:
   - Pass `enabled` through properly; SpinWheel in spin panel should also show greyscale for disabled options
6. Update `spinWheel` in `main.mo` to skip options where `enabled == false`
