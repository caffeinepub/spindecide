import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SpinEntry } from "../backend.d";

function formatTs(ts: bigint) {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

interface Props {
  history: SpinEntry[];
  isLoading: boolean;
}

const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c"];

export default function SpinHistory({ history, isLoading }: Props) {
  return (
    <div data-ocid="history.table">
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Time
            </TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Result
            </TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">
              Weight
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            SKELETON_KEYS.map((k) => (
              <TableRow key={k}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-8 ml-auto" />
                </TableCell>
              </TableRow>
            ))
          ) : history.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground text-sm py-8"
                data-ocid="history.empty_state"
              >
                No spins yet — give the wheel a spin!
              </TableCell>
            </TableRow>
          ) : (
            history.slice(0, 20).map((entry, i) => (
              <TableRow
                key={`${String(entry.timestamp)}-${entry.selectedLabel}`}
                data-ocid={`history.row.${i + 1}`}
                className="border-border"
              >
                <TableCell className="text-xs text-muted-foreground">
                  {formatTs(entry.timestamp)}
                </TableCell>
                <TableCell>
                  <span className="font-medium text-sm">
                    {entry.selectedLabel}
                  </span>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {(Number(entry.selectedWeight) / 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
