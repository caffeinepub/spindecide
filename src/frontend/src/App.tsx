import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Loader2, LogOut, Plus, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Wheel, WheelOption } from "./backend.d";
import SpinHistory from "./components/SpinHistory";
import SpinWheel, { type SpinWheelHandle } from "./components/SpinWheel";
import WheelCard from "./components/WheelCard";
import WheelEditor from "./components/WheelEditor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useCreateWheel,
  useDeleteWheel,
  useGetSpinHistory,
  useGetWheels,
  useSpinWheel,
  useUpdateWheel,
} from "./hooks/useQueries";

const WHEEL_COLORS = [
  "#F59E0B",
  "#EF4444",
  "#14B8A6",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
];

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

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3"];

// ── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen confetti-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-wheel border-border">
        <CardContent className="pt-8 pb-8 px-8 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              aria-label="SpinDecide logo"
              role="img"
            >
              {WHEEL_COLORS.map((c, i) => {
                const start = i * 60;
                const end = start + 60;
                const a1 = ((start - 90) * Math.PI) / 180;
                const a2 = ((end - 90) * Math.PI) / 180;
                const x1 = 32 + 28 * Math.cos(a1);
                const y1 = 32 + 28 * Math.sin(a1);
                const x2 = 32 + 28 * Math.cos(a2);
                const y2 = 32 + 28 * Math.sin(a2);
                return (
                  <path
                    key={c}
                    d={`M 32 32 L ${x1} ${y1} A 28 28 0 0 1 ${x2} ${y2} Z`}
                    fill={c}
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
              <circle cx="32" cy="32" r="8" fill="white" />
              <circle cx="32" cy="32" r="4" fill="#2563EB" />
            </svg>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                SpinDecide
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your personal decision maker
              </p>
            </div>
          </div>

          <div className="w-full space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Create weighted spin wheels, save your decisions, and track your
              history.
            </p>
            <Button
              onClick={() => login()}
              disabled={isLoggingIn}
              data-ocid="auth.primary_button"
              className="w-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Connecting…
                </>
              ) : (
                "Login to Get Started"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header({ onLogout }: { onLogout: () => void }) {
  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{ backgroundColor: "oklch(0.18 0.04 245)" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
        <div className="flex items-center gap-2.5 mr-auto">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            aria-label="SpinDecide logo"
            role="img"
          >
            {WHEEL_COLORS.map((c, i) => {
              const start = i * 60;
              const end = start + 60;
              const a1 = ((start - 90) * Math.PI) / 180;
              const a2 = ((end - 90) * Math.PI) / 180;
              const x1 = 14 + 12 * Math.cos(a1);
              const y1 = 14 + 12 * Math.sin(a1);
              const x2 = 14 + 12 * Math.cos(a2);
              const y2 = 14 + 12 * Math.sin(a2);
              return (
                <path
                  key={c}
                  d={`M 14 14 L ${x1} ${y1} A 12 12 0 0 1 ${x2} ${y2} Z`}
                  fill={c}
                  stroke="white"
                  strokeWidth="1"
                />
              );
            })}
            <circle cx="14" cy="14" r="4" fill="white" />
          </svg>
          <span className="text-white font-bold text-lg tracking-tight">
            SpinDecide
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          data-ocid="auth.secondary_button"
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <LogOut size={14} className="mr-1.5" />
          Sign Out
        </Button>
      </div>
    </header>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

const NEW_WHEEL_ID = "__new__";

export default function App() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const isAuthed = !!identity;

  const { data: wheels = [], isLoading: wheelsLoading } = useGetWheels();
  const [selectedWheelId, setSelectedWheelId] = useState<string | null>(null);

  const createWheel = useCreateWheel();
  const updateWheel = useUpdateWheel();
  const deleteWheel = useDeleteWheel();
  const spinWheelMut = useSpinWheel();

  const activeWheelId =
    selectedWheelId === NEW_WHEEL_ID ? null : selectedWheelId;
  const selectedWheel = wheels.find((w) => w.id === activeWheelId) ?? null;
  const isNewWheel = selectedWheelId === NEW_WHEEL_ID;

  const { data: spinHistory = [], isLoading: historyLoading } =
    useGetSpinHistory(activeWheelId);

  const wheelRef = useRef<SpinWheelHandle>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<{
    label: string;
    color: string;
  } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const handleSpin = async () => {
    if (!selectedWheel || isSpinning) return;
    setIsSpinning(true);
    try {
      const result = await spinWheelMut.mutateAsync(selectedWheel.id);
      if (result !== null) {
        const entry = result;
        const option = selectedWheel.options.find(
          (o) => o.optionLabel === entry.selectedLabel,
        );
        const color = option
          ? (option.color ??
            DEFAULT_COLORS[
              selectedWheel.options.indexOf(option) % DEFAULT_COLORS.length
            ])
          : DEFAULT_COLORS[0];
        await wheelRef.current?.spinTo(entry.selectedLabel, 4000);
        setSpinResult({ label: entry.selectedLabel, color });
        setShowResultModal(true);
      } else {
        toast.error("Spin failed. Does the wheel have enabled options?");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSpinning(false);
    }
  };

  const handleSaveWheel = async (name: string, options: WheelOption[]) => {
    try {
      if (isNewWheel || !activeWheelId) {
        const w = await createWheel.mutateAsync({ name, options });
        setSelectedWheelId(w.id);
        toast.success("Wheel created!");
      } else {
        await updateWheel.mutateAsync({
          id: activeWheelId,
          input: { name, options },
        });
        toast.success("Wheel saved!");
      }
    } catch {
      toast.error("Failed to save wheel");
    }
  };

  const handleDeleteWheel = async (wheel: Wheel) => {
    try {
      await deleteWheel.mutateAsync(wheel.id);
      if (selectedWheelId === wheel.id) setSelectedWheelId(null);
      toast.success(`"${wheel.name}" deleted`);
    } catch {
      toast.error("Failed to delete wheel");
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthed) return <LoginScreen />;

  const displayOptions = selectedWheel?.options ?? [];
  const enabledOptions = displayOptions.filter((o) => o.enabled !== false);
  const isSaving = createWheel.isPending || updateWheel.isPending;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster position="top-right" />
      <Header onLogout={clear} />

      <main className="flex-1 confetti-bg">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-extrabold text-foreground mb-8 tracking-tight">
            Your Decision Hub
          </h1>

          <div className="flex gap-6 flex-col lg:flex-row">
            {/* ── Left Column ── */}
            <div className="w-full lg:w-[38%] flex flex-col gap-4">
              <div>
                <p className="text-muted-foreground text-sm mb-4">
                  Select a wheel to spin or edit, or create a new one.
                </p>

                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Your Saved Wheels
                </h2>

                <div className="grid grid-cols-1 gap-3">
                  {wheelsLoading
                    ? SKELETON_KEYS.map((k) => (
                        <Skeleton key={k} className="h-20 rounded-xl" />
                      ))
                    : wheels.map((w, i) => (
                        <WheelCard
                          key={w.id}
                          wheel={w}
                          isSelected={selectedWheelId === w.id}
                          onSelect={() => setSelectedWheelId(w.id)}
                          onDelete={() => handleDeleteWheel(w)}
                          index={i + 1}
                        />
                      ))}

                  {wheels.length === 0 && !wheelsLoading && (
                    <div
                      data-ocid="wheels.empty_state"
                      className="text-center text-muted-foreground text-sm py-4"
                    >
                      No wheels yet — create your first one!
                    </div>
                  )}

                  <button
                    type="button"
                    data-ocid="wheels.open_modal_button"
                    onClick={() => setSelectedWheelId(NEW_WHEEL_ID)}
                    className={`rounded-xl p-4 border-2 border-dashed transition-all text-center flex flex-col items-center gap-2 cursor-pointer ${
                      isNewWheel
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50 text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <Plus size={20} />
                    <span className="text-sm font-medium">
                      Create New Wheel
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right Column ── */}
            <div className="flex-1 flex flex-col gap-4">
              {selectedWheelId ? (
                <>
                  <Card className="border-border shadow-card">
                    <CardContent className="p-6">
                      <div className="flex gap-6 flex-col md:flex-row">
                        {/* Spin panel */}
                        <div className="flex flex-col items-center gap-4 flex-shrink-0">
                          <h2 className="text-lg font-semibold text-foreground self-start">
                            Spin The Wheel
                          </h2>
                          <SpinWheel
                            ref={wheelRef}
                            options={displayOptions}
                            size={260}
                          />
                          <Button
                            onClick={handleSpin}
                            disabled={
                              isSpinning ||
                              enabledOptions.length < 2 ||
                              isNewWheel
                            }
                            data-ocid="spin.primary_button"
                            size="lg"
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base"
                          >
                            {isSpinning ? (
                              <>
                                <RotateCcw
                                  size={16}
                                  className="mr-2 animate-spin"
                                />
                                Spinning…
                              </>
                            ) : (
                              "🎯 Spin!"
                            )}
                          </Button>
                          {isNewWheel && (
                            <p className="text-xs text-muted-foreground text-center">
                              Save the wheel first to enable spinning.
                            </p>
                          )}
                          {!isNewWheel && enabledOptions.length < 2 && (
                            <p className="text-xs text-muted-foreground text-center">
                              Enable at least 2 options to spin.
                            </p>
                          )}
                        </div>

                        <Separator
                          orientation="vertical"
                          className="hidden md:block"
                        />

                        {/* Editor panel */}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-semibold text-foreground mb-4">
                            Option Editor
                          </h2>
                          <WheelEditor
                            key={selectedWheelId}
                            initialName={selectedWheel?.name ?? ""}
                            initialOptions={selectedWheel?.options ?? []}
                            isSaving={isSaving}
                            onSave={handleSaveWheel}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {activeWheelId && (
                    <Card className="border-border shadow-card">
                      <CardHeader className="pb-2 pt-5 px-6">
                        <CardTitle className="text-base font-semibold">
                          Spin History
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-6 pb-5">
                        <SpinHistory
                          history={spinHistory}
                          isLoading={historyLoading}
                        />
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="text-5xl mb-4">🎡</div>
                  <p className="text-lg font-semibold text-foreground">
                    Select a wheel to get started
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose from your saved wheels or create a new one.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-4 px-6">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {showResultModal && spinResult && (
        <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
          <DialogContent
            className="max-w-sm text-center"
            data-ocid="spin.dialog"
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                The wheel has spoken! 🎉
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center shadow-wheel"
                style={{ backgroundColor: spinResult.color }}
              >
                <span className="text-white font-bold text-sm text-center px-2 leading-tight">
                  {spinResult.label}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                {spinResult.label}
              </p>
            </div>
            <Button
              onClick={() => setShowResultModal(false)}
              data-ocid="spin.close_button"
              className="w-full bg-primary text-primary-foreground"
            >
              Got it!
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
